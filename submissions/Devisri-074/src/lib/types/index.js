/**
 * Core Domain Entities & Type Definitions for Prep Manager
 */

export const ComplianceStatus = {
  PASS: 'PASS',
  FAIL: 'FAIL',
  NEEDS_REVIEW: 'NEEDS_REVIEW',
  NOT_REQUIRED: 'NOT_REQUIRED',
};

export const StationStatus = {
  GREEN_RELEASE: 'GREEN_RELEASE',
  RED_REWORK: 'RED_REWORK',
  AMBER_REVIEW: 'AMBER_REVIEW',
  GRAY_PENDING: 'GRAY_PENDING',
};

export const DispositionAction = {
  READY_FOR_PACK: 'READY_FOR_PACK',
  REWORK_REQUIRED: 'REWORK_REQUIRED',
  HOLD_FOR_REVIEW: 'HOLD_FOR_REVIEW',
  SCRAP_DISPOSE: 'SCRAP_DISPOSE',
};

export const QualityGrade = {
  GOOD: 'GOOD',
  WARNING: 'WARNING',
  BAD: 'BAD',
};

export const DemoScenarios = [
  { id: 'PERFECT', label: '1. Fully Compliant Unit (PASS)', description: 'Correct polybag, visible warning, flat FNSKU, covered UPC' },
  { id: 'POLYBAG_FAIL', label: '2. Missing Polybag / Unsealed (FAIL)', description: 'Apparel unit missing required sealed polybag enclosure' },
  { id: 'WARNING_FAIL', label: '3. Missing Suffocation Warning (FAIL)', description: 'Polybag opening ≥ 5" without required safety warning' },
  { id: 'BARCODE_FAIL', label: '4. Exposed Manufacturer Barcode (FAIL)', description: 'Original UPC is visible/uncovered, creating mis-scan risk' },
  { id: 'FNSKU_SEAM_FAIL', label: '5. FNSKU Label Wrapped on Seam (FAIL)', description: 'FNSKU affixed across carton fold, warping barcode lines' },
  { id: 'POOR_IMAGE', label: '6. Quality Gate Drop / Glare (UNCERTAIN)', description: 'Harsh reflection over barcode zone trigger NEEDS_REVIEW' },
  { id: 'REWORK_PASS', label: '7. Post-Rework Re-Inspection (PASS)', description: 'Re-inspection Attempt #2 after warehouse remediation' },
];
