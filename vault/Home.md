---
title: John Deere App Planning Home
tags:
  - john-deere
  - app-plan
  - obsidian
status: draft
---

# John Deere App Planning Home

This vault is the planning brain for a new John Deere-focused web application hosted on an existing DigitalOcean VPS droplet.

## Core planning notes

- [[10-product/Product Brief|Product Brief]]
- [[20-architecture/System Architecture|System Architecture]]
- [[20-architecture/Obsidian Data Brain|Obsidian Data Brain]]
- [[30-operations/DigitalOcean Deployment Runbook|DigitalOcean Deployment Runbook]]
- [[40-decisions/Open Questions and Decisions|Open Questions and Decisions]]

## Working assumptions

- The app is a private or customer-facing tool related to John Deere equipment, operations, service, inventory, or reporting.
- The VPS droplet is already provisioned and reachable.
- Obsidian is used as the human-editable knowledge layer behind the app, not as the only transactional datastore.
- If official John Deere data is required, the app should use approved APIs and credentials rather than scraping or unmanaged exports.

## Recommended next steps

1. Confirm the first user role and the first business workflow in [[10-product/Product Brief|Product Brief]].
2. Decide whether Obsidian is the canonical data source, a content-management layer, or a documentation/knowledge layer in [[20-architecture/Obsidian Data Brain|Obsidian Data Brain]].
3. Select the initial runtime stack and persistence layer in [[20-architecture/System Architecture|System Architecture]].
4. Prepare the droplet using the checklist in [[30-operations/DigitalOcean Deployment Runbook|DigitalOcean Deployment Runbook]].
5. Convert unresolved items into explicit decisions in [[40-decisions/Open Questions and Decisions|Open Questions and Decisions]].
