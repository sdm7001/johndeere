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
- [[10-product/Warranty Claim Narrative Standard|Warranty Claim Narrative Standard]]
- [[20-architecture/System Architecture|System Architecture]]
- [[20-architecture/Obsidian Data Brain|Obsidian Data Brain]]
- [[30-operations/DigitalOcean Deployment Runbook|DigitalOcean Deployment Runbook]]
- [[30-operations/Deployment Status|Deployment Status]]
- [[40-decisions/Open Questions and Decisions|Open Questions and Decisions]]
- [[50-warranty-rules/CDR Format Rules|CDR Format Rules]]
- [[50-warranty-rules/WAM 110.14 - Diagnostic Labor|WAM 110.14 - Diagnostic Labor]]
- [[50-warranty-rules/WAM 110.16 - Clean Up Labor|WAM 110.16 - Clean Up Labor]]
- [[90-sources/Source Register|Source Register]]

## Working assumptions

- The app is a private or customer-facing tool related to John Deere equipment, operations, service, inventory, or reporting.
- The VPS droplet is already provisioned and reachable.
- The public app hostname will be `jd.texmg.com`.
- Clerk is the selected user authentication provider.
- Obsidian is used as the human-editable knowledge layer behind the app, not as the only transactional datastore.
- If official John Deere data is required, the app should use approved APIs and credentials rather than scraping or unmanaged exports.
- The first defined workflow is dealer-grade warranty CDR claim processing, documented in [[10-product/Warranty Processing SOP|Warranty Processing SOP]].
- Uploaded WAM and CDR transition guide PDFs are registered in [[90-sources/Source Register|Source Register]] as authorized project sources.

## Recommended next steps

1. Register the remaining official MST/flat-rate, Service Advisor, and warranty operation code sources needed by [[10-product/Warranty Processing SOP|Warranty Processing SOP]].
2. Configure DNS and Clerk application settings for `jd.texmg.com`.
3. Confirm the first user role and warranty workflow boundaries in [[10-product/Product Brief|Product Brief]].
4. Decide whether Obsidian is the canonical data source, a content-management layer, or a documentation/knowledge layer in [[20-architecture/Obsidian Data Brain|Obsidian Data Brain]].
5. Select the initial runtime stack and persistence layer in [[20-architecture/System Architecture|System Architecture]].
6. Prepare the droplet using the checklist in [[30-operations/DigitalOcean Deployment Runbook|DigitalOcean Deployment Runbook]].
7. Convert unresolved items into explicit decisions in [[40-decisions/Open Questions and Decisions|Open Questions and Decisions]].
