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
- Deployment is blocked because SSH password authentication for the provided VPS credentials is rejected for both `root` and `ubuntu`.

## Next action needed

Provide one of the following so deployment can continue:

- Correct SSH password for the droplet user.
- SSH private key for a user with sudo/root access.
- Add the deployment public key from this environment to the droplet's authorized keys.
- Temporary DigitalOcean console access to reset SSH credentials.
