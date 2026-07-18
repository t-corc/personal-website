# Tommaso Corciulo Portfolio

A dependency-free personal website with a local-first CRM prototype.

## Run locally

```bash
npm run dev
```

Then open `http://127.0.0.1:4173`.

## Structure

- `index.html`: content and page structure
- `styles.css`: visual design and responsive layouts
- `script.js`: form submission and browser interactions
- `server.mjs`: local static server for preview and private tooling
- `crm/`: CRM schema, source adapters, and local editor prototype
- `crm/local-editor/`: private browser-based editor for JSON records
- `docs/CRM_ARCHITECTURE.md`: iCloud and Cloudflare intake architecture
- `assets/`: CV and future project assets

## CRM intake

CRM records are modeled as individual JSON files with one stable `id`, standard
fields, a dynamic `custom` object, and a `review` section for later LLM cleanup.

The preferred private storage target is an iCloud Drive folder selected from the
local CRM editor. The public GitHub Pages site should not store personal data in
this repository.

Production intake should use a Cloudflare Worker as a no-storage relay from the
public homepage to an iCloud email/attachment workflow. See
`docs/CRM_ARCHITECTURE.md`.

To pull CRM JSON attachments from Apple Mail into iCloud Drive:

```bash
npm run crm:import-mail
```

By default this saves matching `[TC-CRM:...]` JSON attachments into
`~/Library/Mobile Documents/com~apple~CloudDocs/CRM Intake`. Then open the local
editor at `http://127.0.0.1:4173/crm/local-editor/` and choose that folder.
