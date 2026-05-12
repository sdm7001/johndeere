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

Build a focused web application that helps users turn John Deere-related operational information into useful actions, reports, and decisions. The app should be small enough to operate reliably on a DigitalOcean VPS while using Obsidian as the editable knowledge brain behind the data.

## Primary users to define

Choose one primary user for the first version:

- Farm or fleet owner tracking equipment and field activity.
- Equipment manager tracking service intervals, downtime, and assignments.
- Dealer or service team tracking customer equipment, notes, and follow-ups.
- Internal analyst turning exported John Deere data into reports and summaries.

## Candidate first workflows

Pick one workflow as the minimum lovable product:

1. **Equipment knowledge hub**
   - Store machines, serial numbers, service notes, manuals, attachments, and links.
   - Use Obsidian notes for human-maintained context.
   - Expose clean search and detail pages in the app.

2. **Service and maintenance planner**
   - Track equipment hours, service intervals, upcoming work, and completed tasks.
   - Keep procedures, dealer notes, and troubleshooting notes in Obsidian.
   - Show due/overdue service views in the app.

3. **Operations reporting dashboard**
   - Import or enter field operations, fuel, usage, cost, and job data.
   - Use Obsidian for definitions, field mappings, report explanations, and annotations.
   - Generate reports by machine, field, season, or customer.

4. **Dealer/customer follow-up tracker**
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

## Data categories

- Equipment: model, serial number, year, owner, status, hours, location.
- People or accounts: owner, operator, dealer contact, service contact.
- Events: service, repair, inspection, field operation, issue, communication.
- Documents: manuals, invoices, photos, attachments, external links.
- Knowledge: troubleshooting, procedures, operating notes, definitions, decisions.

## Non-goals for the first version

- Replacing John Deere Operations Center.
- Building a mobile native app before validating the web workflow.
- Making Obsidian the only database for high-frequency transactional data.
- Supporting many tenants before the single-organization workflow is stable.

## Success criteria

- A user can find a machine or account quickly and understand its current status.
- Important knowledge can be edited in Obsidian without developer involvement.
- The app can be redeployed on the droplet from Git with documented steps.
- Backups can restore both the database and the vault.
