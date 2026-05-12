---
title: Product Brief
tags:
  - product
  - requirements
  - john-deere
status: draft
---

# Product Brief

## Product goal

Build a focused web application that helps a John Deere dealership process warranty claims into audit-ready CDR write-ups. The app should be small enough to operate reliably on a DigitalOcean VPS while using Obsidian as the editable knowledge brain behind warranty rules, claim procedures, and product decisions.

## Primary users to define

Primary user for the first version:

- Warranty administrator or service manager at a John Deere dealership validating and formatting claims before submission.

Secondary users to consider later:

- Farm or fleet owner tracking equipment and field activity.
- Equipment manager tracking service intervals, downtime, and assignments.
- Dealer or service team tracking customer equipment, notes, and follow-ups.
- Internal analyst turning exported John Deere data into reports and summaries.

## Candidate first workflows

Selected first workflow:

1. **Dealer-grade warranty CDR processor**
   - Intake customer complaint and technician write-up.
   - Validate warranty coverage using authorized WAM, CDR transition guide, MST/flat-rate, Service Advisor, and warranty operation code sources.
   - Produce a compliant CDR claim in the required `Key part number`, `Cause`, `Diagnose`, `Repair`, and `Clean up` format.
   - Break down actual labor time per diagnostic, repair, and cleanup step.
   - Stop and cite WAM section references when a repair is not covered.
   - See [[Warranty Processing SOP]].

Candidate later workflows:

2. **Equipment knowledge hub**
   - Store machines, serial numbers, service notes, manuals, attachments, and links.
   - Use Obsidian notes for human-maintained context.
   - Expose clean search and detail pages in the app.

3. **Service and maintenance planner**
   - Track equipment hours, service intervals, upcoming work, and completed tasks.
   - Keep procedures, dealer notes, and troubleshooting notes in Obsidian.
   - Show due/overdue service views in the app.

4. **Operations reporting dashboard**
   - Import or enter field operations, fuel, usage, cost, and job data.
   - Use Obsidian for definitions, field mappings, report explanations, and annotations.
   - Generate reports by machine, field, season, or customer.

5. **Dealer/customer follow-up tracker**
   - Track accounts, equipment, issues, promised actions, and call notes.
   - Use Obsidian as the rich relationship map between customers, machines, and issues.
   - Provide reminders and status dashboards.

## Minimum app capabilities

- Authentication for at least one admin user.
- Searchable records for equipment, people/accounts, notes, and tasks.
- Obsidian-backed knowledge pages rendered safely in the web app.
- Structured metadata through YAML frontmatter in vault notes.
- Admin workflow to refresh/reindex the Obsidian vault.
- Backups for both app database and Obsidian vault.
- Warranty claim intake form for complaint, technician write-up, machine details, coverage type, and supporting evidence.
- Authorized-source library for WAM, CDR transition guide, MST/flat-rate references, Service Advisor outputs, and warranty operation code references.
- Claim drafting workflow that enforces the CDR structure in [[Warranty Processing SOP]].
- Coverage decision workflow that stops non-covered claims and requires WAM section citations.
- Source register that tracks confidential warranty documents, versions, checksums, and ingestion status in [[90-sources/Source Register|Source Register]].

## Data categories

- Equipment: model, serial number, year, owner, status, hours, location.
- People or accounts: owner, operator, dealer contact, service contact.
- Events: service, repair, inspection, field operation, issue, communication.
- Documents: manuals, invoices, photos, attachments, external links.
- Knowledge: troubleshooting, procedures, operating notes, definitions, decisions.
- Warranty sources: WAM sections, CDR guide references, MST times, operation codes, Service Advisor evidence.
- Claims: complaint, technician write-up, key part, cause, diagnostics, repair steps, cleanup eligibility, coverage decision, citations, and submission status.

## Non-goals for the first version

- Replacing John Deere Operations Center.
- Replacing official Deere warranty systems or submitting claims automatically before validation.
- Building a mobile native app before validating the web workflow.
- Making Obsidian the only database for high-frequency transactional data.
- Supporting many tenants before the single-organization workflow is stable.
- Making coverage determinations from unofficial sources.

## Success criteria

- A warranty administrator can convert a complaint and technician write-up into a compliant CDR draft.
- Covered claims include step-by-step diagnostic, repair, and eligible cleanup time.
- Non-covered claims stop before CDR generation and cite the applicable WAM section.
- Important warranty guidance can be edited in Obsidian without developer involvement.
- The app can be redeployed on the droplet from Git with documented steps.
- Backups can restore both the database and the vault.
