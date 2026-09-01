# Alaif Cafe — storefront

Static, dark sport-urban streetwear-padel landing page. No build step.
Data-driven from the live Shopify catalog.

## Run locally
```
cd ~/alaif/storefront
python3 -m http.server 5173
# open http://localhost:5173
```

## Files
- `index.html` — sections: header · typographic hero (optional video) · marquee · Drop 01 shop · story · range · email capture · footer
- `styles.css` — all design tokens at `:root` (palette, custom easing curves, type). Motion is transform/opacity-only, reduced-motion aware.
- `app.js` — renders the shop from `products.json`, header scroll state, IntersectionObserver reveals, color-swatch image swap (blur-masked), add-to-bag → Shopify cart permalink, email capture (stashes to `localStorage`).
- `products.json` — the catalog snapshot (5 products, colors, sizes, prices, per-color images, variant IDs). **Generated from Shopify — do not hand-edit.**
- `assets/` — drop real media here (see below)

## Checkout — how it works (no SDK, no token)
Each "Add to bag" builds a **Shopify cart permalink**:
`https://v01mih-rr.myshopify.com/cart/<variantId>:1`
This adds the selected color+size variant and goes to Shopify checkout, which
auto-routes fulfillment to Tapstitch. No Buy Button embed or Storefront token needed.

⚠️ **Checkout only completes once the store is off the trial plan** and the
storefront password page is removed. Until then the permalink opens the password gate.

## Refreshing the catalog (products.json)
The catalog is a snapshot pulled from Shopify (titles, prices, colors, sizes,
per-color variant images, variant IDs). When products change, ask the `/alaif`
agent to **refresh products.json** — it re-queries Shopify (products + variant
images) and regenerates the file. Color→image mapping comes from each variant's
`image` field, so swatches always show the true garment.

## Assets to drop in (`assets/`)
| File | Used by | Notes |
|---|---|---|
| `hero.mp4` | hero background video | short loop, muted, ~1080p, compressed. `app.js` auto-detects it and reveals the video; until then the hero uses a dark gradient. |
| `hero-poster.jpg` | hero poster/fallback | first frame, shows before video loads |
| lifestyle / campaign shots | `story`, `range` | currently reuse Shopify product mockups. Swap in real lifestyle photography for a true lookbook — that's the one asset still needed from Valentin. |

## Brand + decisions
See `../docs/brand.md` (confirmed aesthetic) and `../docs/shopify.md`. Palette/easing
live in `styles.css :root` — change once, propagates everywhere. Accent is an acid
"volt" green (padel-court energy) used sparingly on a black-forward palette.
