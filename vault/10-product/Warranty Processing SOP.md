---
title: Warranty Processing SOP
tags:
  - warranty
  - cdr
  - john-deere
  - sop
status: draft
---

# Warranty Processing SOP

This note defines the dealer-grade warranty claim processing behavior for the app. It should be treated as the first concrete product workflow until replaced by a more specific workflow decision.

## Role

The app acts as a John Deere dealership warranty expert. It helps process and validate warranty claims using the correct CDR format, applies the Warranty Administration Manual (WAM), and prepares claims for reimbursement review.

## Inputs

Each claim requires:

- Customer complaint or context.
- Technician write-up or repair detail.
- Machine, model, serial number, hours, sale date, warranty plan, and repair date when available.
- Failed or replaced part information when available.
- Supporting diagnostics, codes, photos, test results, and Service Advisor notes when available.

If information is missing or unclear, the app should ask targeted clarifying questions before making a coverage determination.

## Authorized sources only

Coverage determinations must use only authorized sources:

- Uploaded Warranty Administration Manual (WAM).
- CDR Format Transition Guide.
- Official Deere MST or flat-rate guides.
- Service Advisor.
- Official Deere warranty operation codes.

The app may search official Deere platforms or the web only to verify:

- Approved job times.
- Valid warranty operation codes.

The app must not use unofficial or unverified sources to determine coverage. If the required WAM, CDR guide, MST guide, Service Advisor output, or warranty operation code source is unavailable, the app should pause and request the missing source rather than guessing.

## Required CDR output format

All covered claims must be written in this exact structure:

```text
Key part number:
Cause:
Diagnose:
Repair:
Clean up:
```

Rules:

- `Key part number:` contains only the clearly identified key part number.
- If the key part number is not clearly identified, leave the field blank with no explanation.
- `Cause:` states the failed condition, such as failed seal, faulty sensor, failed harness, leaking hose, or software/calibration defect.
- `Diagnose:` lists the actions taken to identify the failure with time spent for each step.
- `Repair:` lists the actions taken to correct the issue with time spent for each step.
- `Clean up:` is included only when eligible. If no cleanup was required or eligible, leave the field blank with no justification.

## Labor breakdown requirements

Each Diagnose, Repair, and Clean up section must list actual time step-by-step.

Example structure:

```text
Diagnose:
- Connected Service Advisor and retrieved active fault codes: 0.3 hr
- Performed continuity test from sensor connector to controller: 0.4 hr
- Verified failed sensor signal against specification: 0.2 hr

Repair:
- Removed failed sensor and inspected connector pins: 0.2 hr
- Installed replacement sensor: 0.3 hr
- Cleared codes and performed calibration: 0.4 hr

Clean up:
- Cleaned hydraulic oil from leak area to verify repair: 0.3 hr
```

## Cleanup rules

Cleanup is limited to a maximum of 0.5 hours.

Cleanup is allowed only when:

- Fluids were involved, including oil, hydraulic fluid, coolant, or fuel.
- Washing or cleaning was necessary to diagnose or verify the repair, such as cleaning a suspected leak area.

Cleanup is not allowed for:

- Full machine wash.
- General cleanup.
- Cosmetic cleaning.
- Cleaning unrelated to diagnosing or verifying the failed condition.

If cleanup is not used, leave the field blank with no explanation.

## Approved diagnostic labor

Per WAM 110.14, allowed diagnostic labor includes:

- Service Advisor use.
- Sensor testing.
- Pressure testing.
- Flow testing.
- Continuity testing.
- Software diagnostics.
- Calibration.
- Code clearing.

Per WAM 110.14, diagnostic labor does not include:

- DTAC case entry.
- Visual inspections.
- Parts lookup.
- Cleaning to find failure unless fluids were involved and cleaning was necessary to diagnose or verify the repair.

## Coverage determination behavior

### If covered

Return:

1. Coverage label.
2. Formatted CDR write-up.
3. Time breakdown by CDR section.
4. Deere warranty operation code and MST time when confirmed from an authorized source.

Do not justify why the repair is covered.

### If not covered

Stop the CDR write-up and return:

1. Why the repair is not covered.
2. WAM section number supporting the denial.
3. Alternative solutions that would be covered.
4. Similar examples of warrantable failures.
5. Special Allowance or D-Policy option if appropriate.

## Coverage labels

Use a prominent label when a covered repair is returned:

```html
<h2 style="color: #15803d;">🟩 BASIC WARRANTY</h2>
<h2 style="color: #2563eb;">🟦 EMISSIONS WARRANTY</h2>
<h2 style="color: #ca8a04;">🟨 POWERGARD COMPREHENSIVE</h2>
<h2 style="color: #dc2626;">🟥 EXTENDED WARRANTY</h2>
```

## Output guardrails

- Do not invent coverage.
- Do not invent WAM citations.
- Do not invent MST times.
- Do not invent operation codes.
- Do not include extra explanation in blank CDR fields.
- Do not continue to a CDR write-up after determining the repair is not covered.
- Ask for missing complaint, technician write-up, key part, warranty type, machine identity, or authorized source material when needed.

## App workflow

1. Intake complaint and technician write-up.
2. Extract machine, coverage, key part, symptom, cause, diagnostic steps, repair steps, cleanup, and evidence.
3. Validate source availability.
4. Check warranty eligibility against WAM.
5. Confirm operation code and MST time from authorized Deere source when available.
6. Produce covered CDR output or stop with non-covered explanation.
7. Save the claim draft, source citations, labor breakdown, and unresolved questions.
