# Shopify Discount Code Finder

**Automatically scan Shopify storefronts, banners, and announcement bars to extract working promotional discount codes and coupons.**

Deal aggregators and coupon sites rely on massive teams to manually hunt for discount codes. This actor completely automates the process by employing advanced Regular Expressions (Regex) and targeted DOM parsing to extract promotional codes directly from Shopify storefronts.

## What can this Actor do?

- ✅ **Smart Regex Detection** - Looks for standard promo phrases (e.g., "Use code WELCOME10", "code: FREESHIP", "SAVE20") across the entire webpage.
- ✅ **Targeted Extraction** - Specifically hunts inside high-probability elements like top announcement bars, promotional banners, and headers where stores usually advertise their discounts.
- ✅ **Contextual Descriptions** - Doesn't just find the code; it extracts the surrounding sentence so you know what the code actually does (e.g., "Get 20% off your first order").
- ✅ **High Speed** - Relies entirely on static `Cheerio` parsing, allowing it to scan thousands of stores rapidly.

## Why use this Actor?

- 🎯 **Coupon Aggregators** - Automatically feed fresh, working discount codes into your Honey or RetailMeNot clones.
- 🤝 **Competitive Intelligence** - Monitor exactly what discounts your competitors are currently offering.
- 📊 **Marketing Analytics** - Track the frequency and types of promotions run by leading brands.

## How to use it

1. Enter a list of Shopify store URLs into the **Shopify Store URLs** field.
2. Set the **Max Pages to Scan Per Store** limit to control how deep the crawler looks (default is 5 pages, which usually hits the homepage, collections, and sale pages).
3. Click Start!

## How much does it cost?

This actor uses a **Pay-Per-Event (PPE)** pricing model. You only pay for the exact number of unique discount codes successfully found!
- **$2.00 per 1,000 codes extracted.**

## Output Example

When a code is found, the actor pushes this data to your dataset:

```json
{
  "storeUrl": "https://colourpop.com",
  "code": "WELCOME10",
  "description": "Use code WELCOME10 for 10% off your first order!",
  "foundOnUrl": "https://colourpop.com/",
  "scrapedAt": "2023-10-25T15:00:00.000Z"
}
```
