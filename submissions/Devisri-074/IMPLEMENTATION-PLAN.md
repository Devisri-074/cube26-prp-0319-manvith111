# Implementation Plan: Upgrading Prep Manager

**Developer:** Koya Devisri Chowdary (`Devisri-074`)  
**Project:** Prep Manager · Visual Compliance & Audit Engine  
**Working Repository:** https://github.com/Devisri-074/cube26-prp-0319/tree/prep  
**Date:** October 2026  

---

## 1. Prioritized Implementation Roadmap

### Phase 1 (P0): Core Cryptographic Integrity & Quality Gate
- [x] **Canonical SHA-256 Digesting (`src/lib/crypto/hash.ts`):** Deterministic key sorting, evidence seal generation (`EVD-...`), and integrity verification.
- [x] **Pre-flight Image Quality Gate (`src/lib/vision/quality.ts`):** Blur, resolution, glare hotspot detection, underexposure, and contrast evaluation.

### Phase 2 (P1): Perception Layer & Deterministic Rules Engine
- [x] **Domain Types & Schemas (`src/lib/types/index.ts`):** Typed definitions for Inspections, Checks, Quality Reports, Vision Observations, Products, Work Orders, and Dispute Packets.
- [x] **Modular Vision Provider Layer (`src/lib/vision/`):** Provider factory with support for Mock/Local Demo, StationCV, OpenAI Vision, Claude Vision, and Ollama with automatic fail-open fallback.
- [x] **Authoritative Rules & Engine (`src/lib/rules/`):** Complete FBA/Prep ruleset (`FBA-POLY-001`, `FBA-WARN-002`, `FBA-LB-001`, `FBA-BAR-001`, `FBA-EXP-001`, `WO-MARK-001`) with explicit bounding boxes and remediations.
- [x] **End-to-End Orchestrator (`src/lib/orchestrator.ts`):** Headless verification workflow connecting requirements -> quality gate -> single-batch inference -> rules evaluation -> cryptographic seal -> storage.

### Phase 3 (P2): Multi-Tenant Database, Dispute Packets & Automated Testing
- [x] **Multi-Tenant Database Engine (`src/lib/db/index.ts`):** Persistent repository with organization scoping (`org_demo_alpha`, `org_demo_bravo`, `org-apex-01`), attempt history, and supervisor overrides.
- [x] **Automated Test Suite (`tests/suite.mjs`):** 13 comprehensive unit/integration test assertions covering hash determinism, tamper detection, quality gate, all compliance rules, priority ordering, overrides, and dispute packet schemas.
- [x] **Configured Test Command:** Add `"test": "node tests/suite.mjs"` in `package.json`.

### Phase 4 (P3): Operator Dashboard & Architecture Documentation
- [x] **Inspection Canvas Overlay (`src/components/InspectionCanvasOverlay.jsx`):** Render normalized visual bounding boxes for detected barcodes, polybags, warnings, and defect regions.
- [x] **Demo Scenario Switcher & Work Orders:** Support interactive test cases (`PERFECT`, `BARCODE_FAIL`, `POLYBAG_FAIL`, `FNSKU_SEAM_FAIL`, `POOR_IMAGE`, `REWORK_PASS`).
- [x] **Dispute Recovery Packet Viewer & Downstream Contract:** View and download verified dispute packets for warehouse conveyor dispatch.
- [x] **System Architecture Documentation (`docs/ARCHITECTURE.md`):** Complete system design, data flows, and perception vs policy rationale.
- [x] **Verification & Evaluation Report (`VERIFICATION-REPORT.md`):** Test execution log and compliance verification.
