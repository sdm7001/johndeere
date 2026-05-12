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
- [[10-product/Warranty Processing SOP|Warranty Processing SOP]]
- [[20-architecture/System Architecture|System Architecture]]
- [[20-architecture/Obsidian Data Brain|Obsidian Data Brain]]
- [[30-operations/DigitalOcean Deployment Runbook|DigitalOcean Deployment Runbook]]
- [[40-decisions/Open Questions and Decisions|Open Questions and Decisions]]

## Working assumptions

- The app is a private or customer-facing tool related to John Deere equipment, operations, service, inventory, or reporting.
- The VPS droplet is already provisioned and reachable.
- Obsidian is used as the human-editable knowledge layer behind the app, not as the only transactional datastore.
- If official John Deere data is required, the app should use approved APIs and credentials rather than scraping or unmanaged exports.
- The first defined workflow is dealer-grade warranty CDR claim processing, documented in [[10-product/Warranty Processing SOP|Warranty Processing SOP]].

## Recommended next steps

1. Upload or reference the authorized WAM, CDR transition guide, MST/flat-rate source, and warranty operation code source needed by [[10-product/Warranty Processing SOP|Warranty Processing SOP]].
2. Confirm the first user role and warranty workflow boundaries in [[10-product/Product Brief|Product Brief]].
3. Decide whether Obsidian is the canonical data source, a content-management layer, or a documentation/knowledge layer in [[20-architecture/Obsidian Data Brain|Obsidian Data Brain]].
4. Select the initial runtime stack and persistence layer in [[20-architecture/System Architecture|System Architecture]].
5. Prepare the droplet using the checklist in [[30-operations/DigitalOcean Deployment Runbook|DigitalOcean Deployment Runbook]].
6. Convert unresolved items into explicit decisions in [[40-decisions/Open Questions and Decisions|Open Questions and Decisions]].
