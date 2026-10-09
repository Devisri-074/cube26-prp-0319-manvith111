# Prep Manager — Architecture & System Design

**Developer:** Koya Devisri Chowdary (`Devisri-074`)  
**Project:** Prep Manager · Visual Compliance & Audit Engine  
**Working Repository:** https://github.com/Devisri-074/cube26-prp-0319/tree/prep  

---

## 1. System Overview

**Prep Manager** is an autonomous **Visual Prep Compliance Agent**. It verifies that every inbound product unit meets strict warehouse packaging and labeling compliance standards before shipment.

```text
┌─────────────────┐
│  Physical Unit  │
│  Arrives Station│
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Image Capture   │ Multi-angle cameras / Station capture (up to 4 views)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Image Quality   │ Pre-flight evaluation: Blur, Glare, Resolution, Exposure, Occlusion
│      Gate       │ [Rule 4: "Cannot verify" must NEVER automatically become "PASS"]
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Vision & OCR    │ Multimodal Vision + Optical Character Recognition
│ Observation     │ Outputs structured perceptual tokens (bounding boxes, text, confidence)
│     Layer       │ [AI NEVER makes pass/fail decisions directly]
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Deterministic   │ Applies rigid mathematical predicates & category requirements:
│  Rules Engine   │ Polybag, Suffocation Warning, FNSKU, Barcode Cover, Expiry, Handling
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Final Decision  │ PASS (READY_FOR_PACK) | FAIL (REWORK_REQUIRED) | NEEDS_REVIEW (HOLD)
│  & Disposition  │ Priority: FAIL > NEEDS_REVIEW > PASS
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ SHA-256 Audit   │ Cryptographic fingerprint generated across record + evidence
│      Seal       │ [Tamper-Evident Canonical JSON Digest]
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Downstream      │ Machine-readable JSON contract for packing conveyors & dispute recovery
│ Agent Dispatch  │
└─────────────────┘
```

---

## 2. Why Vision AI Does NOT Make Pass/Fail Decisions Directly

A foundational architectural requirement in industrial logistics is **deterministic compliance**:

1. **Hallucination Mitigation**: Multimodal LLMs are non-deterministic and susceptible to subtle prompt variations. Asking an LLM *"Does this bag pass compliance?"* creates unpredictable compliance drift.
2. **Perception vs. Policy Separation**:
   - **Perception Layer (AI / Vision)**: Responsible exclusively for extracting objective visual facts:
     - `polybag.isSealed: true` (confidence: 0.96)
     - `originalBarcode.coverageState: "COVERED"`
     - `fnsku.placementState: "FLAT"`
     - Normalized bounding boxes `[ymin, xmin, ymax, xmax]`
   - **Policy Layer (Deterministic Rules Engine)**: Responsible for evaluating policy predicates against warehouse specifications:
     ```javascript
     if (requirements.coverOriginalBarcode && observations.originalBarcode.detected && !observations.originalBarcode.isCoveredCompletely) {
       return { result: 'FAIL', disposition: 'REWORK_REQUIRED', remediation: 'Completely cover manufacturer UPC' };
     }
     ```
3. **Auditability & Traceability**: Every check decision maps directly to an exact rule ID (`FBA-BAR-001`), an authoritative standard citation, an explanation, and specific operator remediation instructions.

---

## 3. Core Modules

### 1. Vision Abstraction Layer (`src/lib/vision/`)
- `provider.js`: Unified dispatcher supporting OpenAI Vision, Claude Vision, StationCV, and Local Deterministic demo providers.
- `quality.js`: Pre-flight Image Quality Gate validating sharpness, illumination, and reflection specularity.
- `observations.js`: Normalization of raw detections into canonical observation records and visual bounding box overlays.

### 2. Deterministic Rules Engine (`src/lib/rules/`)
- `engine.js`: Evaluates mandatory and optional compliance rules and aggregates final disposition with strict priority ordering (`FAIL` > `NEEDS_REVIEW` > `PASS`).
- `rulePacks/prep.js`: Standard Amazon FBA / Warehouse compliance ruleset:
  - `FBA-POLY-001`: Polybag enclosure & hermetic seal verification.
  - `FBA-WARN-002`: Suffocation warning verification for openings >= 5 inches.
  - `FBA-LB-001`: FNSKU exterior label & barcode string verification on flat surface.
  - `FBA-BAR-001`: Original manufacturer UPC/EAN blackout/cover verification.
  - `FBA-EXP-001`: Expiration date extraction & 90-day minimum shelf-life check.
  - `WO-MARK-001`: Special orientation marks (THIS SIDE UP, FRAGILE, KEEP DRY).

### 3. Cryptographic Audit Vault (`src/lib/crypto/`)
- `hash.js`: Computes deterministic canonical SHA-256 digests over inspection records. Any data alteration invalidates the audit seal. Generates machine-readable Dispute Recovery Packets (`DISPUTE-PKT-...`).

### 4. Multi-Tenant Database (`src/lib/db/`)
- Row-level organization isolation (`org_demo_alpha`, `org_demo_bravo`).
- Multi-attempt re-inspection lineage tracking (`unitId`, `attemptNumber`, `parentInspectionId`).
- Immutable Supervisor Overrides audit log preserving original verdicts, reviewer identity, and mandatory rationale.
