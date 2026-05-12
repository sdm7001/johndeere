---
title: Obsidian Data Brain
tags:
  - obsidian
  - data-model
  - knowledge-base
status: draft
---

# Obsidian Data Brain

## Role of Obsidian

Obsidian should act as the human-editable knowledge brain behind the app. It is best used for context-rich data that benefits from links, history, and narrative:

- Warranty SOPs, CDR formatting rules, and internal claim handling procedures.
- Uploaded or summarized authorized-source references such as WAM sections, CDR transition guidance, and operation-code notes.
- Equipment notes and relationships.
- Service procedures and troubleshooting.
- Customer/account context.
- Definitions and field mappings.
- Report explanations and decision notes.
- Curated links between machines, people, events, and documents.

Use the app database for transactional state that needs validation, permissions, reporting, or frequent writes.

## Vault as data source

Each note can expose structured metadata through YAML frontmatter. The indexer turns this metadata into queryable records.

### Example equipment note

```markdown
---
type: equipment
equipment_id: jd-8r-410-001
model: 8R 410
serial_number: TBD
year: 2024
status: active
owner: "[[Example Farm]]"
tags:
  - equipment
  - tractor
---

# 8R 410

## Summary

Primary tillage tractor.

## Service notes

- [[Service Procedure - 500 Hour Inspection]]
- Last reviewed: 2026-05-12
```

### Example service procedure note

```markdown
---
type: procedure
procedure_id: svc-500-hour-inspection
applies_to:
  - 8R 410
tags:
  - service
  - procedure
---

# Service Procedure - 500 Hour Inspection

Steps, safety notes, parts, and links.
```

## Recommended note types

| Type | Purpose | Stored in app database? |
| --- | --- | --- |
| `equipment` | Machine identity and human context | Indexed copy, canonical structured fields in database if app edits them |
| `account` | Customer, farm, dealer, or organization context | Yes for CRM-like workflows |
| `person` | Operators, technicians, contacts | Yes if permissions or tasks depend on people |
| `event` | Service, repair, inspection, operation, communication | Yes for reporting and audit history |
| `warranty_source` | Authorized WAM, CDR, MST, Service Advisor, or operation-code reference | Indexed from Obsidian with source metadata |
| `claim_template` | Reusable CDR prompt or claim formatting rule | Indexed from Obsidian |
| `procedure` | Maintenance and troubleshooting knowledge | Indexed from Obsidian |
| `definition` | Business terms, field mappings, report meanings | Indexed from Obsidian |
| `decision` | Product and operational decisions | Obsidian only unless shown in app |

## Warranty source metadata

Warranty-related notes should identify source type and authority so the app can distinguish authorized references from general knowledge.

```markdown
---
type: warranty_source
source_type: wam
section: "110.14"
title: Diagnostic Labor
authority: authorized
effective_date: TBD
tags:
  - warranty
  - diagnostic-labor
---
```

Rules:

- Coverage determinations must cite an authorized source.
- If a source note lacks section, source type, or authority metadata, the app should not use it for coverage decisions.
- MST times and warranty operation codes should be stored with the source name, retrieval date, and applicable model or component scope.
- Service Advisor outputs should be attached to a claim record or referenced as evidence, not treated as general policy.

## Indexing workflow

1. Author or update notes in Obsidian.
2. Commit or sync the vault to the VPS.
3. Indexer scans changed Markdown files.
4. Indexer validates frontmatter against known schemas.
5. Indexer stores:
   - note path
   - title
   - note type
   - frontmatter fields
   - outgoing links
   - rendered/searchable text
   - updated timestamp
6. App reads indexed records and renders sanitized Markdown.

## Link conventions

- Use stable IDs in frontmatter for records the app references.
- Use Obsidian links for human navigation: `[[Machine Name]]`.
- Avoid relying on display titles as database keys.
- Prefer one note per durable entity.

## Governance rules

- Do not store secrets, API keys, passwords, private tokens, or raw credentials in Obsidian.
- Treat notes as versioned content; use Git history for auditability.
- Define schemas before app features depend on note metadata.
- Surface invalid notes in the admin dashboard rather than failing silently.

## Open design choice

Choose one of these operating modes:

1. **Read-only vault mode:** Obsidian edits content; app only reads/indexes it. This is safest for the first version.
2. **App-assisted vault mode:** App creates or updates notes from admin forms. This is useful later but requires careful file locking, conflict handling, and Git/sync strategy.
3. **Database-first mode:** App database is canonical; Obsidian receives generated notes for documentation and review.

Recommendation: start with read-only vault mode, then add app-assisted note creation only after the schemas and user workflows are stable.
