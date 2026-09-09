# PLUGIN MATCH — front-end prototype

This is a static HTML/CSS/JavaScript prototype based on the Canva screens supplied in chat.

## Files

- `index.html` — homepage, hero, featured plugin carousel and category grid
- `compressors.html` — compressor category browser with subtype filters and search
- `plugin.html` — FET-76 detail page with interactive control hotspots
- `styles.css` — complete responsive design system
- `app.js` — carousel, search, filters, navigation, tooltips and toast messages
- `assets/` — image crops taken from the mockups supplied in chat

## Run locally

You can double-click `index.html` and it will work in most browsers.

For the most reliable local development setup, open this folder in VS Code and run a simple local server, for example:

```bash
python -m http.server 8080
```

Then visit:

```text
http://localhost:8080
```

Alternatively, install the VS Code extension **Live Server** and choose **Open with Live Server** on `index.html`.

## Important before production

The current images were cropped from the supplied Canva mockup screenshots, so replace them with the original high-resolution plugin screenshots/assets before publishing.

The download button is intentionally not connected to an external URL yet. Add only official vendor download/product links in production.

## Suggested next step

Once the visual direction is approved, migrate the data into a structured JSON/API or a Next.js project so new plugins can be added without creating a new page manually.
