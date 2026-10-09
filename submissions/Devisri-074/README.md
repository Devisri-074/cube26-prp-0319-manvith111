# Devisri-074 · Prep Manager

> **Autonomous Visual Prep Compliance & Deterministic Auditing Engine**

## Project & Developer Identity

- **Developer Name:** Koya Devisri Chowdary
- **Team:** CodeQuesters
- **Role:** Prep Manager Developer
- **Email:** [devisrichowdarykoya@gmail.com](mailto:devisrichowdarykoya@gmail.com)
- **Track:** Prep Manager
- **Project:** Prep Manager
- **GitHub Profile:** [https://github.com/Devisri-074](https://github.com/Devisri-074)
- **Working Repository/Branch:** [https://github.com/Devisri-074/cube26-prp-0319/tree/prep](https://github.com/Devisri-074/cube26-prp-0319/tree/prep)
- **Team Repository (Reference Only):** [https://github.com/ANSHUL-REAL/cube-pod12-round3](https://github.com/ANSHUL-REAL/cube-pod12-round3)

---

## Overview & Architecture

**Prep Manager** is an industrial-grade visual compliance assistant that verifies prepared product units against strict warehouse and Amazon FBA packaging policies before inbound shipment.

### Core Architectural Principles
1. **Perception vs. Policy Separation:** AI/Computer Vision providers only observe physical properties (`isSealed: true`, `placement: FLAT`, `bounding boxes`); deterministic mathematical rules decide compliance (`PASS`, `FAIL`, `NEEDS_REVIEW`).
2. **Rule 1 — Tenancy Isolation:** Database entities and image access are strictly scoped to authenticated organizations (`org_demo_alpha`, `org_demo_bravo`).
3. **Rule 2 — Single-Batch Evaluation:** Evaluates all unit checks in a single multi-check perception pass to maximize throughput and gross margin.
4. **Rule 3 — Fail-Open Resilience:** Provider timeouts or errors record captures as `NEEDS_REVIEW` without blocking physical conveyor lines.
5. **Rule 4 — UNCERTAIN as a First-Class Outcome:** Low-quality captures (blur, glare, occlusion) trigger explicit review rather than dangerous low-confidence passes.
6. **Rule 45/46 — SHA-256 Evidence Seal & Overrides:** Deterministic canonical JSON digests (`EVD-...`) seal records against tampering. Overrides preserve original verdicts immutably.
7. **Rule 47 — Honest Accuracy Metrics:** Per-rule Pass/Fail/Uncertain breakdowns with false positive and false negative tracking.

---

## Quickstart & Commands

### 1. Install Dependencies
```bash
npm install
```

### 2. Run Automated Test Suite
```bash
npm test
# Executes the 13-test automated compliance suite in tests/suite.mjs
```

### 3. Start Local Development Server
```bash
npm run dev
# Starts local development server at http://localhost:5173
```

### 4. Build Production Bundle
```bash
npm run build
```

---

## Deliverables & Documentation Index

- [COMPARISON-REPORT.md](file:///c:/Users/devis/Downloads/Devisri_Prep_Manager_Workspace/cube-02-prep-manager/submissions/Devisri-074/COMPARISON-REPORT.md) — Comprehensive technical comparison matrix against reference implementation.
- [IMPLEMENTATION-PLAN.md](file:///c:/Users/devis/Downloads/Devisri_Prep_Manager_Workspace/cube-02-prep-manager/submissions/Devisri-074/IMPLEMENTATION-PLAN.md) — Prioritized engineering plan and milestone checklist.
- [VERIFICATION-REPORT.md](file:///c:/Users/devis/Downloads/Devisri_Prep_Manager_Workspace/cube-02-prep-manager/submissions/Devisri-074/VERIFICATION-REPORT.md) — Test logs and 100% verification report across all 13 test scenarios.
- [docs/ARCHITECTURE.md](file:///c:/Users/devis/Downloads/Devisri_Prep_Manager_Workspace/cube-02-prep-manager/submissions/Devisri-074/docs/ARCHITECTURE.md) — In-depth system design, data flows, and module contracts.
