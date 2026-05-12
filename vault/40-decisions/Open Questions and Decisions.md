---
title: Open Questions and Decisions
tags:
  - decisions
  - planning
status: draft
---

# Open Questions and Decisions

Use this note to turn uncertainty into explicit decisions. Each answer should either update the product brief, architecture, or deployment runbook.

## Product questions

- Confirm the first primary user: warranty administrator, service manager, or technician?
- Confirm the first workflow scope: CDR drafting only, or CDR drafting plus coverage validation?
- Is this app internal, customer-facing, or public?
- Does the app need John Deere Operations Center API integration, or will manual entry/imports work first?
- What data is sensitive, regulated, confidential, or customer-owned?
- What reports or decisions must the app improve?
- Should the app store finalized claim drafts, or only generate copy-ready output?
- Should the app support Special Allowance or D-Policy review workflows in version 1?

## Warranty source questions

- Where will the production copy of the uploaded Warranty Administration Manual be stored on the VPS?
- Is JDWAM0001 15Apr26 English the current WAM version to use for version 1?
- Should the CDR Format Transition Guide remain a PDF source, or should key rules also be converted into structured Markdown source notes?
- How will official Deere MST or flat-rate guides be accessed?
- How will valid warranty operation codes be verified?
- Can Service Advisor evidence be exported and attached to claim records?
- Who approves updates to authorized-source notes before the app uses them for coverage decisions?
- What should the app do when a source conflict exists between WAM, MST, Service Advisor, and operation-code references?
- Should source PDFs be stored in a private object store, encrypted droplet directory, or separate private repository?

## Obsidian questions

- Is Obsidian the canonical source for entity metadata, or is it the knowledge layer around database records?
- Who edits the vault?
- Will the vault live in this repository, a separate private repository, Obsidian Sync, or another sync system?
- Should the web app ever write back to Markdown notes?
- What note schemas are required for version 1?

## Technical questions

- Preferred app framework and language?
- PostgreSQL or SQLite for the first release?
- Is a staging environment needed on the same droplet or a second droplet?
- What domain name will point to the app?
- How should emails, notifications, or reminders be sent?
- What attachment storage is required for manuals, photos, PDFs, and invoices?

## Operations questions

- What backup destination should be used off the droplet?
- Who receives monitoring and backup failure alerts?
- What is the expected restore process if the droplet fails?
- How often will the vault be edited and deployed?
- Who owns server patching and dependency updates?

## Initial decisions

### Decision: Use Obsidian as the knowledge brain, not the only database

- Status: proposed
- Rationale: Obsidian is excellent for linked notes, context, procedures, and human-maintained metadata. A database is safer for authentication, tasks, audit history, imports, reporting, and high-frequency writes.

### Decision: Start with read-only vault indexing

- Status: proposed
- Rationale: Letting the app read from the vault is simpler and safer than letting both Obsidian and the app write to the same Markdown files.

### Decision: Deploy with Docker Compose on the existing DigitalOcean droplet

- Status: proposed
- Rationale: A single VPS can run the initial app, database, proxy, and worker with manageable operational complexity.

### Decision: Make warranty CDR processing the first workflow

- Status: proposed
- Rationale: The warranty processing SOP defines a concrete dealership workflow with clear inputs, source constraints, output format, and validation rules.

### Decision: Require authorized-source citations for coverage decisions

- Status: proposed
- Rationale: Warranty reimbursement depends on audit-ready claims. The app must not invent WAM citations, MST times, operation codes, or coverage determinations from unofficial sources.

### Decision: Register uploaded WAM and CDR guide as authorized local sources

- Status: accepted
- Rationale: The user provided the WAM and CDR transition guide as project data. The documents are now tracked in [[90-sources/Source Register|Source Register]] with version/effective date and checksums.

### Decision: Keep confidential source PDFs out of Git by default

- Status: accepted
- Rationale: The WAM is marked confidential. The local vault can contain the PDFs for Obsidian use, but Git ignores `vault/90-sources/files/*.pdf` until repository privacy and document-sharing rules are confirmed.
