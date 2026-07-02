import { Actor } from 'apify';
import { CheerioCrawler, log } from 'crawlee';

await Actor.init();

try {
    const input = await Actor.getInput();
    if (!input || !input.storeUrls || input.storeUrls.length === 0) {
        throw new Error('storeUrls input is required!');
    }

    const { storeUrls, maxPagesPerStore = 5 } = input;

    // Normalize URLs
    const startUrls = storeUrls.map(u => {
        let urlStr = u.url || u;
        return { url: urlStr, userData: { store: urlStr, depth: 0 } };
    });

    let totalCodesExtracted = 0;
    // Track codes globally to avoid charging/pushing the same code multiple times per run
    const foundCodes = new Set();

    // Regex patterns for finding discount codes
    const CODE_REGEX = /(?:use code|code:|code|promo code|coupon code|enter code|use promo)\s+([A-Z0-9]{4,15})\b/gi;
    const STANDALONE_REGEX = /\b(SAVE\d{2}|OFF\d{2}|WELCOME\d{2}|FREESHIP)\b/gi;

    const crawler = new CheerioCrawler({
        maxConcurrency: 10,
        
        async requestHandler({ request, $, log, enqueueLinks }) {
            const url = request.url;
            const storeUrl = request.userData.store;
            const depth = request.userData.depth;
            
            log.info(`Scanning for discounts on: ${url}`);
            
            // Text to scan: Target high probability elements first
            const elementsToScan = [
                $('.announcement-bar').text(),
                $('.promo-bar').text(),
                $('.header').text(),
                $('.banner').text(),
                $('#banner').text(),
                $('.ticker').text(),
                $('body').text() // Fallback to scanning the whole body
            ];

            let codesOnPage = 0;

            for (const text of elementsToScan) {
                if (!text) continue;

                // Clean up whitespace for better matching
                const cleanText = text.replace(/\s+/g, ' ');

                // 1. Look for explicit "use code X" patterns
                let match;
                while ((match = CODE_REGEX.exec(cleanText)) !== null) {
                    const code = match[1].toUpperCase();
                    if (!foundCodes.has(code)) {
                        foundCodes.add(code);
                        
                        // Extract context (approx 50 chars before and after)
                        const matchIndex = match.index;
                        const start = Math.max(0, matchIndex - 50);
                        const end = Math.min(cleanText.length, matchIndex + match[0].length + 50);
                        const description = cleanText.substring(start, end).trim();

                        await pushCode(storeUrl, code, description, url);
                        codesOnPage++;
                    }
                }

                // 2. Look for standalone common formats (SAVE20, etc.)
                while ((match = STANDALONE_REGEX.exec(cleanText)) !== null) {
                    const code = match[1].toUpperCase();
                    if (!foundCodes.has(code)) {
                        foundCodes.add(code);
                        
                        const matchIndex = match.index;
                        const start = Math.max(0, matchIndex - 50);
                        const end = Math.min(cleanText.length, matchIndex + match[0].length + 50);
                        const description = cleanText.substring(start, end).trim();

                        await pushCode(storeUrl, code, description, url);
                        codesOnPage++;
                    }
                }
            }

            if (codesOnPage > 0) {
                log.info(`✅ Found ${codesOnPage} unique codes on ${url}`);
            }

            // Enqueue more pages if we haven't hit the depth limit
            if (depth < maxPagesPerStore) {
                await enqueueLinks({
                    strategy: 'same-hostname',
                    globs: ['**/*sale*', '**/*collections*', '**/*pages/promos*'],
                    transformRequestFunction(req) {
                        req.userData = { store: storeUrl, depth: depth + 1 };
                        return req;
                    },
                });
            }
        },
        
        async failedRequestHandler({ request, log }) {
            log.error(`Failed to scan ${request.url}`);
        },
    });

    async function pushCode(storeUrl, code, description, foundOnUrl) {
        const output = {
            storeUrl,
            code,
            description,
            foundOnUrl,
            scrapedAt: new Date().toISOString()
        };

        await Actor.pushData(output);
        totalCodesExtracted++;
        
        // PPE Monetization - $2.00 per 1000 codes
        await Actor.charge({ eventName: 'code-extracted', count: 1 });
    }

    log.info(`Starting Shopify Discount Finder for ${startUrls.length} stores...`);
    
    await crawler.addRequests(startUrls);
    await crawler.run();

    log.info(`🎉 Finished! Extracted a total of ${totalCodesExtracted} unique discount codes.`);
} catch (error) {
    log.error('Actor failed:', error);
    throw error;
}

await Actor.exit();
