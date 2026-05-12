---
title: Deployment Status
tags:
  - deployment
  - operations
  - digitalocean
status: active
---

# Deployment Status

## 2026-05-12

- `jd.texmg.com` DNS A record was created through WHM.
- `jd.texmg.com` resolves to `104.248.126.60`.
- VPS SSH on port 22 is reachable.
- SSH key access as `root` is working.
- The VPS already has Nginx listening on ports 80 and 443.
- Docker and Docker Compose were installed on the VPS.
- The app was deployed to `/opt/johndeere-app/repo`.
- Confidential warranty source PDFs were copied to `/opt/johndeere-app/data/warranty-sources`.
- The app container is running as `repo-app-1`.
- Nginx proxies `jd.texmg.com` to `127.0.0.1:3100`.
- Certbot issued a Let's Encrypt certificate for `jd.texmg.com`.
- `https://jd.texmg.com` returns a Clerk authentication redirect for signed-out users.
- `https://jd.texmg.com/sign-in` returns the app sign-in route.

## Deployment approach

- Deploy the app container on `127.0.0.1:3100` because another Next.js service is already using port 3000.
- Add an Nginx server block for `jd.texmg.com` that proxies to the local app container.
- Use Certbot with the existing Nginx installation for HTTPS.

## Operational commands

Run these on the VPS:

```bash
cd /opt/johndeere-app/repo
docker compose -f docker-compose.nginx.yml ps
docker compose -f docker-compose.nginx.yml logs --tail=100 app
docker compose -f docker-compose.nginx.yml up -d --build
nginx -t
systemctl reload nginx
certbot certificates -d jd.texmg.com
```
