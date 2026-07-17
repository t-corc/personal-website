# TC CRM Relay Worker

Cloudflare Worker for `POST /api/contact`.

It validates the public homepage form, creates a standard CRM JSON record, and
sends that record to `contact@tommasocorciulo.com` as an email attachment. It does not
store CRM data.

## Configure

The Worker expects a Cloudflare Email Service binding named `EMAIL`.

`wrangler.jsonc` contains:

- route: `tommasocorciulo.com/api/*`
- sender: `crm@tommasocorciulo.com`
- recipient: `contact@tommasocorciulo.com`
- allowed origin: `https://tommasocorciulo.com`

Before deploy, verify in Cloudflare that:

1. `tommasocorciulo.com` is an active Cloudflare zone.
2. The hostname is proxied by Cloudflare.
3. Email Service sending is configured for the domain.
4. `crm@tommasocorciulo.com` is an allowed sender.
5. `contact@tommasocorciulo.com` is an allowed recipient, if the binding restricts recipients.

## Deploy

From this directory:

```bash
npx wrangler deploy
```

## Test

After deployment:

```bash
curl -X POST https://tommasocorciulo.com/api/contact \
  -H 'Content-Type: application/json' \
  -d '{
    "firstName": "Test",
    "lastName": "Person",
    "company": "Example Co",
    "role": "Founder",
    "email": "test@example.com",
    "phone": "",
    "message": "Testing the CRM relay."
  }'
```

Expected response:

```json
{
  "id": "...",
  "status": "unreviewed",
  "emailId": "..."
}
```
