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
- DNS for `jd.texmg.com` can point to the droplet.
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

## DNS and TLS

- Create or update an `A` record for `jd.texmg.com` pointing to the droplet public IPv4 address.
- Create an `AAAA` record only if IPv6 is configured and reachable on the droplet.
- Configure the reverse proxy for `jd.texmg.com`.
- Use HTTPS only. Caddy can issue and renew certificates automatically; Nginx should use Certbot or an equivalent ACME client.
- Confirm `https://jd.texmg.com` returns the app health page before enabling real warranty data.

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

## Clerk configuration

Clerk is the selected authentication provider.

Server environment should include the final variable names required by the chosen framework, such as:

- `CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`
- `CLERK_SIGN_IN_URL`
- `CLERK_SIGN_UP_URL`
- `CLERK_AFTER_SIGN_IN_URL`
- `CLERK_AFTER_SIGN_UP_URL`

Recommended URL values:

- Sign in URL: `https://jd.texmg.com/sign-in`
- Sign up URL: `https://jd.texmg.com/sign-up`
- Post sign-in URL: `https://jd.texmg.com/`
- Post sign-up URL: `https://jd.texmg.com/`

Clerk dashboard setup:

- Add `jd.texmg.com` as the production application domain.
- Configure allowed redirect URLs for the sign-in, sign-up, and post-auth routes.
- Disable public sign-up unless the dealership wants self-service account creation.
- Use Clerk for identity and sessions; store app-specific dealer roles in the app database.

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
5. Confirm Clerk production keys and `jd.texmg.com` redirect URLs.
6. Run database migrations.
7. Restart containers with Docker Compose.
8. Run a health check at `https://jd.texmg.com`.
9. Trigger or verify Obsidian vault indexing.

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
- Uptime check target: `https://jd.texmg.com`.
- Disk usage alert.
- Container restart policy.
- Basic error logging with retention.
- TLS certificate renewal check.
- Database backup success notification.

## First production-readiness gate

Before using real customer or operational data, confirm:

- Authentication is enabled.
- Clerk authentication is enabled for warranty claim and source-management areas.
- HTTPS is active on `jd.texmg.com`.
- Backups are running and restorable.
- Secrets are not in Git or Obsidian.
- The vault indexer rejects invalid or unsafe Markdown.
- The app has a simple admin health page.
