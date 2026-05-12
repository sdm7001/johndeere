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

- Who is the first primary user?
- What is the first workflow the app must support?
- Is this app internal, customer-facing, or public?
- Does the app need John Deere Operations Center API integration, or will manual entry/imports work first?
- What data is sensitive, regulated, confidential, or customer-owned?
- What reports or decisions must the app improve?

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
