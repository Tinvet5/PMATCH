# PLUGIN MATCH — Studio Mode Prototype

This iteration adds a visual developer/content editor so plugin modules do not need to be hard-coded one by one.

## Run locally

Use VS Code Live Server, or from this folder run:

```bash
python -m http.server 8080
```

Open:

- Site: http://localhost:8080/index.html
- Studio: http://localhost:8080/studio.html
- Generated sample module: http://localhost:8080/module.html?id=fet76-arturia

Do **not** open the files directly with `file://`; Studio uses IndexedDB and works best from a local web server.

## Studio workflow

1. Open `studio.html`.
2. Create a new module or select the sample FET-76 module.
3. Fill in plugin metadata and the main description.
4. Upload a PNG/JPG/WEBP screenshot.
5. Adjust image zoom and X/Y framing.
6. Click **+ Add label** and then click the exact control on the image.
7. Edit the label title and its description in the **Label** inspector.
8. Drag the hotspot to refine the control position.
9. Drag the label card to position the annotation. The connector line updates automatically.
10. Save the module.
11. Click **Preview** to render the public page from the saved data.
12. Export JSON for a portable backup or future database migration.

## What is data-driven now

A module contains:

- Plugin name and developer
- Category/subtype
- Rating
- Plugin formats / OS support
- Official/download URL
- General description
- Plugin image and framing settings
- Any number of controls/labels
- Each control's hotspot coordinates
- Each callout label's coordinates
- Each control description
- "Ideal for" cards
- "Qualities" cards

`module.html` is a reusable renderer. It reads the module data and generates the page automatically, so you do not create a separate HTML file for every plugin.

## Storage in this prototype

Studio uses browser **IndexedDB**. This is intentionally a frontend-only prototype and requires no server/database credentials.

For production, replace IndexedDB with:

- authenticated admin access,
- a real database for module JSON,
- object/cloud storage for plugin screenshots,
- and a publishing API.

## AI-assisted label generation

This prototype handles visual label creation and descriptions without hard-coding. Fully automatic recognition of knobs/controls from a screenshot would require a secure backend vision/AI endpoint. Do not place an API key directly in `studio.js` or other browser code.

A later Studio iteration can add an **Analyze image** action that sends the uploaded image to a backend and returns suggested control names, descriptions, and approximate coordinates for developer approval.
