# John Deere Warranty CDR MVP

This repository contains a working MVP for a John Deere warranty CDR drafting app intended to run on a DigitalOcean VPS droplet at `jd.texmg.com` with Clerk authentication.

The planning source of truth lives in the Obsidian-compatible Markdown vault at [`vault/Home.md`](vault/Home.md). Open the `vault/` folder as an Obsidian vault to use backlinks, graph view, and linked notes while the product and technical plan evolves.

## MVP features

- Clerk-protected Next.js app.
- Three-box claim intake:
  - original customer complaint
  - technician's write-up
  - workorder time to collect
- CDR draft generation with:
  - key part number extraction when clear
  - Cause, Diagnose, Repair, and Clean up sections
  - step-by-step labor time extraction
  - cleanup guardrails
  - warnings for missing time and non-claimable activities
  - workorder-time reconciliation against claimable CDR time
- Docker Compose and Caddy configuration for `jd.texmg.com`.

## Local development

```bash
npm install
cp .env.example .env.local
npm run dev
```

Set Clerk keys in `.env.local` to enable authentication locally. Without Clerk keys, the app runs in local validation mode and shows a setup warning.

## Production deployment

1. Point DNS `A` record for `jd.texmg.com` to the droplet.
2. Copy `env/app.env.example` to `env/app.env` on the droplet.
3. Add production Clerk keys and URLs to `env/app.env`.
4. Run:

```bash
docker compose up -d --build
```

If the VPS already has Nginx listening on ports 80 and 443, use the Nginx-friendly compose file instead and add an Nginx server block that proxies to `127.0.0.1:3000`:

```bash
docker compose -f docker-compose.nginx.yml up -d --build
```

## Vault layout

- `vault/Home.md` - project index and next steps.
- `vault/10-product/` - product brief, warranty processing SOP, workflows, and requirements.
- `vault/20-architecture/` - system architecture and the Obsidian data-brain design.
- `vault/30-operations/` - VPS deployment, backups, monitoring, and security runbooks.
- `vault/40-decisions/` - open questions, risks, and decision records.
- `vault/90-sources/` - authorized source register and local-only source document guidance.

## Confidential source documents

Warranty source PDFs are copied locally under `vault/90-sources/files/` for Obsidian use, but PDF files in that folder are ignored by Git. See [`vault/90-sources/Source Register.md`](vault/90-sources/Source%20Register.md) for document names, versions, checksums, and handling rules.
