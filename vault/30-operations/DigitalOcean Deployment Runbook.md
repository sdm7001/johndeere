---
title: DigitalOcean Deployment Runbook
tags:
  - operations
  - digitalocean
  - deployment
status: draft
---

# DigitalOcean Deployment Runbook

## Droplet assumptions

- Ubuntu-based VPS droplet is already provisioned.
- DNS can point an app domain or subdomain to the droplet.
- SSH key access is working.
- The repository can be cloned or deployed to the droplet.

## Baseline server checklist

- Create a non-root deploy user with sudo access.
- Disable password-based SSH login.
- Enable firewall rules for:
  - SSH
  - HTTP
  - HTTPS
- Install Docker and Docker Compose plugin.
- Configure automatic security updates.
- Configure log rotation.
- Set server timezone intentionally.
- Verify enough disk space for database, vault, logs, and backups.

## Recommended deployment layout

```text
/opt/johndeere-app/
  repo/
  data/
    postgres/
    backups/
    vault/
    warranty-sources/
  env/
    app.env
```

The app should not store secrets in the Git repo or Obsidian vault. Use environment files on the server or a secret manager.

Confidential warranty source PDFs, including the WAM, should live in a server-side source directory such as `/opt/johndeere-app/data/warranty-sources/`. Do not serve this directory as public static content.

## Docker Compose services

Initial service set:

- `proxy`: Caddy or Nginx, terminates TLS.
- `app`: web app and API.
- `db`: PostgreSQL or SQLite volume, depending on chosen stack.
- `worker`: optional background worker for imports, indexing, and scheduled jobs.

## Deployment flow

1. Push code to the Git branch or main branch selected for deployment.
2. SSH into the droplet as the deploy user.
3. Pull the latest code.
4. Update environment variables if needed.
5. Run database migrations.
6. Restart containers with Docker Compose.
7. Run a health check.
8. Trigger or verify Obsidian vault indexing.

## Vault sync options

Choose one:

### Git-based vault sync

- Store the vault in this repository or a separate private repository.
- Pull updates on deploy.
- Best for versioned planning/content and simple operations.

### Obsidian Sync plus server pull

- Use Obsidian Sync for editors.
- Mirror or export the vault to the server through a controlled sync script.
- Best if non-technical users edit the vault.

### Manual upload

- Upload vault archives to the droplet.
- Least automated; acceptable only for early experiments.

Recommendation: use Git-based vault sync for the first implementation.

## Backup plan

Back up off the droplet:

- Database dump.
- Obsidian vault.
- Confidential warranty source documents.
- Uploaded attachments.
- Environment variable inventory without secret values.
- Docker Compose file and deployment scripts.

Minimum schedule:

- Nightly database backup.
- Nightly vault archive or Git push verification.
- Weekly restore test on a temporary directory or staging environment.

## Monitoring and maintenance

- Uptime check for the public app URL.
- Disk usage alert.
- Container restart policy.
- Basic error logging with retention.
- TLS certificate renewal check.
- Database backup success notification.

## First production-readiness gate

Before using real customer or operational data, confirm:

- Authentication is enabled.
- HTTPS is active.
- Backups are running and restorable.
- Secrets are not in Git or Obsidian.
- The vault indexer rejects invalid or unsafe Markdown.
- The app has a simple admin health page.
