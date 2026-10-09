/**
 * Vision Observations & Bounding Box Compiler
 * Translates raw multi-modal perception tokens into structured bounding boxes for UI overlays
 */

export function compileDetectedObjectBoxes(observations) {
  const boxes = [];

  // Polybag Bounding Box
  if (observations.polybag && observations.polybag.boundingBox) {
    boxes.push({
      label: observations.polybag.isSealed ? 'POLYBAG (SEALED)' : 'POLYBAG (UNSEALED)',
      category: 'POLYBAG',
      color: observations.polybag.isSealed ? '#10b981' : '#f43f5e',
      box: observations.polybag.boundingBox,
      confidence: observations.polybag.confidence || 0.95,
      detail: `State: ${observations.polybag.state || 'DETECTED'}`,
    });
  }

  // Suffocation Warning Bounding Box
  if (observations.suffocationWarning && observations.suffocationWarning.boundingBox) {
    const isPass = observations.suffocationWarning.detected && observations.suffocationWarning.textLegible;
    boxes.push({
      label: 'SUFFOCATION WARNING',
      category: 'WARNING',
      color: isPass ? '#10b981' : '#f59e0b',
      box: observations.suffocationWarning.boundingBox,
      confidence: observations.suffocationWarning.confidence || 0.94,
      detail: observations.suffocationWarning.rawText || '16 CFR 1500 Compliant Warning',
    });
  }

  // FNSKU Barcode Bounding Box
  if (observations.fnsku && observations.fnsku.boundingBox) {
    const isFlat = observations.fnsku.placementState === 'FLAT';
    boxes.push({
      label: `FNSKU: ${observations.fnsku.scannedCode || 'CODE-128'}`,
      category: 'FNSKU',
      color: isFlat ? '#38bdf8' : '#f43f5e',
      box: observations.fnsku.boundingBox,
      confidence: observations.fnsku.confidence || 0.97,
      detail: `Placement: ${observations.fnsku.placementState || 'FLAT'}`,
    });
  }

  // Original Barcode Bounding Box
  if (observations.originalBarcode && observations.originalBarcode.boundingBox) {
    const isCovered = observations.originalBarcode.coverageState === 'COVERED';
    boxes.push({
      label: isCovered ? 'ORIGINAL UPC (COVERED)' : 'ORIGINAL UPC (EXPOSED)',
      category: 'BARCODE',
      color: isCovered ? '#10b981' : '#f43f5e',
      box: observations.originalBarcode.boundingBox,
      confidence: observations.originalBarcode.visibilityConfidence || 0.95,
      detail: isCovered ? 'Covered completely' : `Visible UPC: ${observations.originalBarcode.scannedCode || 'Exposed'}`,
    });
  }

  // Expiry Date Bounding Box
  if (observations.expiryDate && observations.expiryDate.boundingBox) {
    const isValid = observations.expiryDate.detected && (observations.expiryDate.daysRemaining || 365) >= 90;
    boxes.push({
      label: `EXPIRY: ${observations.expiryDate.extractedDate || 'DATE'}`,
      category: 'EXPIRY',
      color: isValid ? '#10b981' : '#f43f5e',
      box: observations.expiryDate.boundingBox,
      confidence: observations.expiryDate.confidence || 0.96,
      detail: `Days remaining: ${observations.expiryDate.daysRemaining ?? 'N/A'}`,
    });
  }

  // Handling Marks Bounding Boxes
  if (observations.handlingMarks && Array.isArray(observations.handlingMarks)) {
    observations.handlingMarks.forEach((m) => {
      if (m.boundingBox) {
        boxes.push({
          label: `MARK: ${m.markType.replace(/_/g, ' ')}`,
          category: 'HANDLING',
          color: '#8b5cf6',
          box: m.boundingBox,
          confidence: m.confidence || 0.94,
          detail: `ISO 780 Standard Symbol (${m.orientation || 'UPRIGHT'})`,
        });
      }
    });
  }

  return boxes;
}
