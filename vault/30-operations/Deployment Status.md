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

## Deployment approach

- Deploy the app container on `127.0.0.1:3000`.
- Add an Nginx server block for `jd.texmg.com` that proxies to the local app container.
- Use Certbot with the existing Nginx installation for HTTPS.
