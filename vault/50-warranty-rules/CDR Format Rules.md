---
type: warranty_rule
source_type: cdr_transition
section: "DTAC 218010"
authority: authorized
status: active
tags:
  - warranty
  - cdr
  - formatting
---

# CDR Format Rules

Effective November 1, 2024, Deere warranty information transitions from the legacy 3Cs format to CDR.

## Required structure

- Complaint identifies symptoms or functional issues.
- Diagnostics includes detailed tests and processes performed to identify root cause.
- Repair specifies which parts were replaced and tasks performed to return the machine to service.

## App output structure

The app formats covered claims as:

```text
Key part number:
Cause:
Diagnose:
Repair:
Clean up:
```

Diagnostics and repair details must include step-by-step time.
