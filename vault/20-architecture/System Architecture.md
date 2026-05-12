---
title: System Architecture
tags:
  - architecture
  - vps
  - digitalocean
status: draft
---

# System Architecture

## Recommended starting architecture

Use a simple single-droplet deployment with Docker Compose:

```text
Internet
  |
  v
Caddy or Nginx reverse proxy with TLS
  |
  v
Web app container
  |
  +--> App database container or managed database
  |
  +--> Obsidian vault directory mounted read-only for the app
  |
  +--> Background indexer job
```

## Application layers

### Web frontend

- Server-rendered or hybrid web UI for fast delivery and low operational overhead.
- Authenticated admin area for managing records, triggering reindexing, and viewing system health.
- Search and detail pages for equipment, accounts, events, and knowledge notes.

### Backend API

- Owns authentication, permissions, validation, imports, and write operations.
- Reads the Obsidian index rather than parsing every Markdown file on each request.
- Keeps transactional records in a database.

### Data persistence

Start with one of these:

- **PostgreSQL** if the app will have structured reporting, multiple users, imports, and relational queries.
- **SQLite** if the first version is single-user, low traffic, and simpler to operate.

The Obsidian vault stores knowledge, definitions, procedures, annotations, decisions, and curated relationships. The database stores accounts, sessions, tasks, structured event data, import state, and audit records.

### Obsidian indexing

- Markdown files live in `vault/`.
- Notes use YAML frontmatter for structured metadata.
- A background indexer parses changed notes and stores searchable note records in the database.
- The app renders sanitized Markdown from trusted vault files.
- Broken links and invalid metadata should show up in an admin health page.

## Suggested technology stack

The final stack can change, but this is a practical baseline for a VPS:

- Runtime: Node.js or Python, depending on the team's comfort.
- Web framework: Next.js, Remix, Django, or FastAPI plus a frontend.
- Database: PostgreSQL.
- Reverse proxy and TLS: Caddy for automatic certificates, or Nginx plus Certbot.
- Process/deployment: Docker Compose.
- Backups: nightly database dump plus vault archive to off-droplet storage.
- Monitoring: uptime check, disk usage alerting, container health checks, and log rotation.

## John Deere integrations

Potential integration sources:

- John Deere Operations Center APIs, when approved credentials are available.
- Exported CSV, Excel, or shapefile data, if API access is not available.
- Manual admin entry for the first version.

Keep integrations isolated behind importer modules so the app can start manually and add official API ingestion later.

## Security baseline

- Use HTTPS only.
- Require admin authentication and strong passwords.
- Keep app secrets in environment variables, not in the vault.
- Mount the vault read-only to the public app unless app-based editing is explicitly required.
- Restrict SSH access to key-based login.
- Enable firewall rules for SSH, HTTP, and HTTPS only.
- Schedule package updates and container image updates.

## Scaling path

The single-droplet design is appropriate for the first version. If usage grows, split out:

1. Managed PostgreSQL.
2. Object storage for attachments and backups.
3. Separate worker container for imports and indexing.
4. CDN-backed static assets.
5. Multi-tenant data model and permission boundaries.
