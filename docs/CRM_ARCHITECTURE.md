# CRM Architecture

The CRM uses the public website as an intake surface, but it does not store
relationship data in GitHub.

## Record Model

Each relationship is stored as one JSON file with a stable `id` assigned when
the record is created.

Core fields live under `fields`:

- `fullName`
- `location`
- `role`
- `company`
- `expertise`
- `howWeMet`
- `email`
- `phone`
- `website`
- `linkedin`
- `industry`
- `notes`

Dynamic columns live under `custom`. This keeps the table flexible without
breaking older records when new attributes are introduced.

```json
{
  "id": "9cf4f0d8-0dd0-4f48-bc21-0f3f5d6e8b2f",
  "schemaVersion": 1,
  "createdAt": "2026-07-15T19:00:00.000Z",
  "updatedAt": "2026-07-15T19:00:00.000Z",
  "source": {
    "id": "main-page",
    "channel": "website"
  },
  "fields": {
    "fullName": "Example Person",
    "location": "Madrid",
    "role": "Founder",
    "company": "Example Co",
    "expertise": "Luxury partnerships",
    "howWeMet": "Website",
    "email": "person@example.com",
    "phone": "",
    "website": "https://example.com",
    "linkedin": "https://www.linkedin.com/in/example",
    "industry": "Hospitality",
    "notes": "Initial note or private context."
  },
  "custom": {
    "relationshipStrength": "Warm"
  },
  "review": {
    "status": "unreviewed",
    "lastReviewedAt": null,
    "notes": ""
  },
  "audit": []
}
```

## Storage

The preferred storage target is an iCloud Drive folder. The local CRM editor can
choose that folder and save individual JSON files there.

Suggested folder:

```text
iCloud Drive/TC CRM/Records/
```

The public site should never write private CRM records into this repository.

## Intake Flow

Production intake should be:

```text
GitHub Pages homepage
  -> Cloudflare Worker relay at tommasocorciulo.com/api/contact
  -> email with JSON attachment to iCloud alias
  -> Mail rule or Shortcut saves attachment into iCloud Drive
  -> local CRM editor opens the folder
```

The Cloudflare Worker should not persist records. It should validate, normalize,
and forward the JSON attachment only.

The Worker scaffold lives in `workers/crm-relay/`.

## LLM Review

The `review` object exists so records can periodically be passed through an LLM
for cleanup, deduplication, enrichment, and schema suggestions. Suggested
review jobs:

- normalize company and role naming
- infer industry from company, website, and notes
- extract expertise and relationship context from notes
- identify duplicate people or companies
- recommend new dynamic fields when patterns appear repeatedly
