# John Deere App Planning Vault

This repository is currently a planning workspace for a new John Deere-focused app intended to run on a DigitalOcean VPS droplet.

The planning source of truth lives in the Obsidian-compatible Markdown vault at [`vault/Home.md`](vault/Home.md). Open the `vault/` folder as an Obsidian vault to use backlinks, graph view, and linked notes while the product and technical plan evolves.

## Vault layout

- `vault/Home.md` - project index and next steps.
- `vault/10-product/` - product brief, warranty processing SOP, workflows, and requirements.
- `vault/20-architecture/` - system architecture and the Obsidian data-brain design.
- `vault/30-operations/` - VPS deployment, backups, monitoring, and security runbooks.
- `vault/40-decisions/` - open questions, risks, and decision records.
- `vault/90-sources/` - authorized source register and local-only source document guidance.

## Confidential source documents

Warranty source PDFs are copied locally under `vault/90-sources/files/` for Obsidian use, but PDF files in that folder are ignored by Git. See [`vault/90-sources/Source Register.md`](vault/90-sources/Source%20Register.md) for document names, versions, checksums, and handling rules.
