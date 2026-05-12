---
title: Source Register
tags:
  - sources
  - warranty
  - wam
  - cdr
status: active
---

# Source Register

This register tracks the authorized warranty source documents available to the project. The source PDFs are copied into `vault/90-sources/files/` for local Obsidian use, but that folder is intentionally ignored by Git because the WAM is marked confidential.

## Authorized source documents

| Source | Local vault file | Uploaded file | Version / effective date | SHA-256 |
| --- | --- | --- | --- | --- |
| John Deere Warranty Administration Manual | `vault/90-sources/files/JD_WAM_ENGLISH_EN.pdf` | `/home/ubuntu/.cursor/projects/workspace/uploads/JD_WAM_ENGLISH_EN.pdf` | JDWAM0001 15Apr26 English | `c71061bebc8fe715f31323363a433428d8653910d7d0515e677f622c24ef9edf` |
| Warranty Update - Transitioning from 3Cs to CDR Format | `vault/90-sources/files/Warranty_Update_Transitioning_from_3Cs_to_CDR_Format.pdf` | `/home/ubuntu/.cursor/projects/workspace/uploads/Warranty_Update_Transitioning_from_3Cs_to_CDR_Format_.pdf` | Effective November 1, 2024; JD WAM Interim Solution DTAC Number 218010 | `4fa9711e679d705d72a3d107c7998772f0f304792acda96b3a1fb0d543b9d55f` |

## Source handling rules

- Treat the WAM as confidential project data.
- Do not commit source PDFs to Git unless the repository and access controls are confirmed appropriate for Deere confidential documents.
- Store the deployable production copy of source PDFs outside the public web root.
- The app may index these documents for warranty decisions only after recording source name, version/effective date, checksum, and ingestion timestamp.
- Coverage decisions must cite the source document and section number.
- MST times, flat-rate times, Service Advisor output, and operation codes still need separate official-source registration before the app can rely on them.

## Current source-backed sections

- WAM 110.12 - Warranty Labor Reimbursement.
- WAM 110.14 - Diagnostic Labor.
- WAM 110.16 - Labor for Clean Up.
- WAM 110.17 - Cleanup for Major Hydraulic Failures.
- CDR transition guide - Complaint, Diagnostics, and Repair format effective November 1, 2024.
- CDR transition guide - diagnostic labor examples and non-claimable diagnostic activities.

## Source conflict notes

- The working SOP includes a dealer operating limit of 0.5 hours for normal cleanup.
- WAM 110.16 states cleanup labor is allowed only when there is fluid loss and washing the area is necessary to complete the repair; washing the entire machine is not paid.
- WAM 110.16 separately states an OEM-only maximum of one hour cleanup labor per repair.
- The app should flag cleanup requests over 0.5 hours for review unless an authorized source-specific rule applies.
