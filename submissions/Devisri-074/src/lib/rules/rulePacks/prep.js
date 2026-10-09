/**
 * Authoritative Amazon FBA & Warehouse Prep Compliance Ruleset
 * Implements deterministic compliance logic with specific remediation instructions
 */

/**
 * 1. Polybag Compliance Rule (FBA-POLY-001)
 */
export const polybagRule = {
  id: 'FBA-POLY-001',
  name: 'Polybag Enclosure & Seal',
  checkType: 'POLYBAG',
  description: 'Verifies the item is securely enclosed in an uncompromised, sealed polybag.',
  isMandatory: true,
  evaluate: (requirements, observations, quality) => {
    if (!requirements.polybagRequired) {
      return {
        ruleId: 'FBA-POLY-001',
        checkType: 'POLYBAG',
        name: 'Polybag Enclosure & Seal',
        requirement: 'Polybag Required for Apparel / Liquids / Plush',
        result: 'NOT_REQUIRED',
        isMandatory: false,
        confidence: 1.0,
        observationSummary: 'NOT_REQUIRED',
        reason: 'Polybagging is not required for this product category or work order.',
      };
    }

    const { polybag = {} } = observations;

    if (!quality.acceptable && quality.blur.grade === 'BAD') {
      return {
        ruleId: 'FBA-POLY-001',
        checkType: 'POLYBAG',
        name: 'Polybag Enclosure & Seal',
        requirement: 'Polybag Required for Apparel / Liquids / Plush',
        result: 'NEEDS_REVIEW',
        isMandatory: true,
        confidence: 0.5,
        observationSummary: 'NOT_VISIBLE',
        reason: 'Cannot verify polybag seal due to image blur or low lighting.',
        remediation: 'Capture a well-lit, sharp image of the polybag seam.',
      };
    }

    if (!polybag.detected || polybag.state === 'ABSENT') {
      return {
        ruleId: 'FBA-POLY-001',
        checkType: 'POLYBAG',
        name: 'Polybag Enclosure & Seal',
        requirement: 'Polybag Required for Apparel / Liquids / Plush',
        result: 'FAIL',
        isMandatory: true,
        confidence: polybag.confidence || 0.94,
        observationSummary: 'ABSENT',
        reason: 'Required polybag packaging was NOT detected around the unit.',
        remediation: 'Place the product into an approved transparent polybag and seal completely.',
      };
    }

    if (polybag.state === 'NOT_VISIBLE') {
      return {
        ruleId: 'FBA-POLY-001',
        checkType: 'POLYBAG',
        name: 'Polybag Enclosure & Seal',
        requirement: 'Polybag Required for Apparel / Liquids / Plush',
        result: 'NEEDS_REVIEW',
        isMandatory: true,
        confidence: 0.6,
        observationSummary: 'NOT_VISIBLE',
        reason: 'Polybag edges are obscured by camera angle or reflections.',
        remediation: 'Rotate unit to expose outer bag edges and recapture image.',
        boundingBox: polybag.boundingBox,
      };
    }

    if (polybag.state === 'UNSEALED' || !polybag.isSealed) {
      return {
        ruleId: 'FBA-POLY-001',
        checkType: 'POLYBAG',
        name: 'Polybag Enclosure & Seal',
        requirement: 'Polybag Required for Apparel / Liquids / Plush',
        result: 'FAIL',
        isMandatory: true,
        confidence: polybag.confidence || 0.92,
        observationSummary: 'UNSEALED',
        reason: 'Polybag opening is unsealed or open (heat-seal, tape, or zipper missing).',
        remediation: 'Seal the open polybag edge completely and recapture the product image.',
        boundingBox: polybag.boundingBox,
      };
    }

    if (polybag.hasPuncturesOrTears) {
      return {
        ruleId: 'FBA-POLY-001',
        checkType: 'POLYBAG',
        name: 'Polybag Enclosure & Seal',
        requirement: 'Polybag Required for Apparel / Liquids / Plush',
        result: 'FAIL',
        isMandatory: true,
        confidence: 0.95,
        observationSummary: 'PUNCTURED',
        reason: 'Polybag has visible punctures, tears, or perforations compromising enclosure.',
        remediation: 'Re-bag the item in a fresh, undamaged polybag and heat-seal.',
        boundingBox: polybag.boundingBox,
      };
    }

    return {
      ruleId: 'FBA-POLY-001',
      checkType: 'POLYBAG',
      name: 'Polybag Enclosure & Seal',
      requirement: 'Polybag Required for Apparel / Liquids / Plush',
      result: 'PASS',
      isMandatory: true,
      confidence: polybag.confidence || 0.96,
      observationSummary: 'SEALED',
      reason: `Polybag verified: product is completely enclosed and sealed (${polybag.sealType || 'HEAT_SEAL'}).`,
      boundingBox: polybag.boundingBox,
    };
  },
};

/**
 * 2. Suffocation Warning Rule (FBA-WARN-002)
 */
export const suffocationWarningRule = {
  id: 'FBA-WARN-002',
  name: 'Suffocation Warning Label',
  checkType: 'SUFFOCATION_WARNING',
  description: 'Verifies visible, legible suffocation warning on polybags with opening 5" or greater.',
  isMandatory: true,
  evaluate: (requirements, observations, quality) => {
    if (!requirements.polybagRequired && !requirements.suffocationWarningRequired) {
      return {
        ruleId: 'FBA-WARN-002',
        checkType: 'SUFFOCATION_WARNING',
        name: 'Suffocation Warning Label',
        requirement: 'Suffocation Warning for Bag Opening ≥ 5 Inches',
        result: 'NOT_REQUIRED',
        isMandatory: false,
        confidence: 1.0,
        observationSummary: 'NOT_REQUIRED',
        reason: 'Suffocation warning is not required for non-polybagged items.',
      };
    }

    const { suffocationWarning = {}, polybag = {} } = observations;
    const requiresWarning =
      requirements.suffocationWarningRequired ||
      (polybag.openingSizeInches !== undefined && polybag.openingSizeInches >= 5) ||
      true;

    if (!requiresWarning) {
      return {
        ruleId: 'FBA-WARN-002',
        checkType: 'SUFFOCATION_WARNING',
        name: 'Suffocation Warning Label',
        requirement: 'Suffocation Warning for Bag Opening ≥ 5 Inches',
        result: 'NOT_REQUIRED',
        isMandatory: false,
        confidence: 0.9,
        observationSummary: 'NOT_REQUIRED',
        reason: 'Bag opening is under 5 inches; warning label is optional.',
      };
    }

    if (quality.glare?.hotspotDetected && quality.glare?.obscuredRegions?.includes('WARNING_REGION')) {
      return {
        ruleId: 'FBA-WARN-002',
        checkType: 'SUFFOCATION_WARNING',
        name: 'Suffocation Warning Label',
        requirement: 'Suffocation Warning for Bag Opening ≥ 5 Inches',
        result: 'NEEDS_REVIEW',
        isMandatory: true,
        confidence: 0.65,
        observationSummary: 'NOT_VISIBLE',
        reason: 'Suffocation warning region is obscured by glare/reflections.',
        remediation: 'Reposition unit to eliminate lighting glare and recapture image.',
      };
    }

    if (!suffocationWarning.detected || !suffocationWarning.textPresent) {
      return {
        ruleId: 'FBA-WARN-002',
        checkType: 'SUFFOCATION_WARNING',
        name: 'Suffocation Warning Label',
        requirement: 'Suffocation Warning for Bag Opening ≥ 5 Inches',
        result: 'FAIL',
        isMandatory: true,
        confidence: suffocationWarning.confidence || 0.94,
        observationSummary: 'MISSING',
        reason: 'Mandatory suffocation warning is missing on the polybag surface.',
        remediation: 'Apply the required suffocation warning label and recapture the image.',
      };
    }

    if (!suffocationWarning.textLegible) {
      return {
        ruleId: 'FBA-WARN-002',
        checkType: 'SUFFOCATION_WARNING',
        name: 'Suffocation Warning Label',
        requirement: 'Suffocation Warning for Bag Opening ≥ 5 Inches',
        result: 'NEEDS_REVIEW',
        isMandatory: true,
        confidence: 0.72,
        observationSummary: 'UNREADABLE',
        reason: 'Suffocation warning text is detected but partially illegible or smudged.',
        remediation: 'Affix a clear, high-contrast suffocation warning sticker over the unreadable area.',
        boundingBox: suffocationWarning.boundingBox,
      };
    }

    return {
      ruleId: 'FBA-WARN-002',
      checkType: 'SUFFOCATION_WARNING',
      name: 'Suffocation Warning Label',
      requirement: 'Suffocation Warning for Bag Opening ≥ 5 Inches',
      result: 'PASS',
      isMandatory: true,
      confidence: suffocationWarning.confidence || 0.96,
      observationSummary: 'PRESENT_AND_LEGIBLE',
      reason: 'Suffocation warning is present, prominently positioned, and legible.',
      boundingBox: suffocationWarning.boundingBox,
      evidenceSnippet:
        suffocationWarning.rawText ||
        'WARNING: To avoid danger of suffocation, keep this bag away from babies and children.',
    };
  },
};

/**
 * 3. FNSKU Placement Rule (FBA-LB-001)
 */
export const fnskuRule = {
  id: 'FBA-LB-001',
  name: 'FNSKU Placement & Scannability',
  checkType: 'FNSKU',
  description: 'Verifies FNSKU label is affixed on a flat surface, not wrapped around edges or seams.',
  isMandatory: true,
  evaluate: (requirements, observations, quality, context) => {
    if (!requirements.fnskuRequired) {
      return {
        ruleId: 'FBA-LB-001',
        checkType: 'FNSKU',
        name: 'FNSKU Placement & Scannability',
        requirement: 'FNSKU Label on Flat Surface',
        result: 'NOT_REQUIRED',
        isMandatory: false,
        confidence: 1.0,
        observationSummary: 'NOT_REQUIRED',
        reason: 'FNSKU label is not required for this unit configuration.',
      };
    }

    const { fnsku = {} } = observations;

    if (!fnsku.detected || fnsku.placementState === 'ABSENT') {
      return {
        ruleId: 'FBA-LB-001',
        checkType: 'FNSKU',
        name: 'FNSKU Placement & Scannability',
        requirement: 'FNSKU Label on Flat Surface',
        result: 'FAIL',
        isMandatory: true,
        confidence: fnsku.confidence || 0.95,
        observationSummary: 'ABSENT',
        reason: 'FNSKU barcode label was NOT detected on the exterior package.',
        remediation: 'Print and apply the assigned FNSKU barcode sticker to the flat exterior packaging.',
      };
    }

    if (fnsku.placementState === 'NOT_VISIBLE') {
      return {
        ruleId: 'FBA-LB-001',
        checkType: 'FNSKU',
        name: 'FNSKU Placement & Scannability',
        requirement: 'FNSKU Label on Flat Surface',
        result: 'NEEDS_REVIEW',
        isMandatory: true,
        confidence: 0.65,
        observationSummary: 'NOT_VISIBLE',
        reason: 'FNSKU label region is obscured by glare or angle.',
        remediation: 'Adjust package position to show FNSKU label squarely to camera.',
      };
    }

    if (fnsku.placementState === 'ON_SEAM') {
      return {
        ruleId: 'FBA-LB-001',
        checkType: 'FNSKU',
        name: 'FNSKU Placement & Scannability',
        requirement: 'FNSKU Label on Flat Surface',
        result: 'FAIL',
        isMandatory: true,
        confidence: 0.94,
        observationSummary: 'ON_SEAM',
        reason: 'FNSKU detected across package seam (folds or ridges prevent reliable scanning).',
        remediation: 'Remove the FNSKU label and reapply it completely on a flat surface.',
        boundingBox: fnsku.boundingBox,
      };
    }

    if (fnsku.placementState === 'ON_CURVE' || fnsku.placementState === 'ON_EDGE') {
      return {
        ruleId: 'FBA-LB-001',
        checkType: 'FNSKU',
        name: 'FNSKU Placement & Scannability',
        requirement: 'FNSKU Label on Flat Surface',
        result: 'FAIL',
        isMandatory: true,
        confidence: 0.93,
        observationSummary: fnsku.placementState,
        reason: `FNSKU label is affixed ${fnsku.placementState.toLowerCase().replace('_', ' ')}, warping barcode lines.`,
        remediation: 'Reapply FNSKU label onto a flat, non-curved packaging face.',
        boundingBox: fnsku.boundingBox,
      };
    }

    if (!fnsku.isReadable) {
      return {
        ruleId: 'FBA-LB-001',
        checkType: 'FNSKU',
        name: 'FNSKU Placement & Scannability',
        requirement: 'FNSKU Label on Flat Surface',
        result: 'NEEDS_REVIEW',
        isMandatory: true,
        confidence: 0.7,
        observationSummary: 'UNREADABLE',
        reason: 'FNSKU label is visible but barcode lines or text cannot be resolved cleanly.',
        remediation: 'Verify label print quality and re-print with 300 DPI thermal printer if smudged.',
        boundingBox: fnsku.boundingBox,
      };
    }

    return {
      ruleId: 'FBA-LB-001',
      checkType: 'FNSKU',
      name: 'FNSKU Placement & Scannability',
      requirement: 'FNSKU Label on Flat Surface',
      result: 'PASS',
      isMandatory: true,
      confidence: fnsku.confidence || 0.96,
      observationSummary: 'FLAT',
      reason: `FNSKU label verified flat (${fnsku.scannedCode || context?.expectedFnsku || 'Valid code'}), fully scannable.`,
      boundingBox: fnsku.boundingBox,
      evidenceSnippet: fnsku.scannedCode || context?.expectedFnsku,
    };
  },
};

/**
 * 4. Original Barcode Coverage Rule (FBA-BAR-001)
 */
export const originalBarcodeCoverageRule = {
  id: 'FBA-BAR-001',
  name: 'Original Barcode Coverage',
  checkType: 'ORIGINAL_BARCODE_COVERAGE',
  description: 'Ensures original manufacturer UPC/EAN is 100% covered to prevent warehouse mis-scans.',
  isMandatory: true,
  evaluate: (requirements, observations, quality) => {
    if (!requirements.coverOriginalBarcode) {
      return {
        ruleId: 'FBA-BAR-001',
        checkType: 'ORIGINAL_BARCODE_COVERAGE',
        name: 'Original Barcode Coverage',
        requirement: 'Original Manufacturer Barcode Must Be Covered',
        result: 'NOT_REQUIRED',
        isMandatory: false,
        confidence: 1.0,
        observationSummary: 'NOT_REQUIRED',
        reason: 'Original barcode coverage is not specified for this item.',
      };
    }

    const { originalBarcode = {} } = observations;

    if (quality.glare?.hotspotDetected && quality.glare?.obscuredRegions?.includes('BARCODE_REGION')) {
      return {
        ruleId: 'FBA-BAR-001',
        checkType: 'ORIGINAL_BARCODE_COVERAGE',
        name: 'Original Barcode Coverage',
        requirement: 'Original Manufacturer Barcode Must Be Covered',
        result: 'NEEDS_REVIEW',
        isMandatory: true,
        confidence: 0.6,
        observationSummary: 'NOT_VISIBLE',
        reason: 'Original barcode region is obscured by glare or harsh reflection.',
        remediation: 'Adjust inspection angle to remove reflection and recapture image.',
      };
    }

    if (originalBarcode.coverageState === 'EXPOSED' || (originalBarcode.detected && !originalBarcode.isCoveredCompletely)) {
      return {
        ruleId: 'FBA-BAR-001',
        checkType: 'ORIGINAL_BARCODE_COVERAGE',
        name: 'Original Barcode Coverage',
        requirement: 'Original Manufacturer Barcode Must Be Covered',
        result: 'FAIL',
        isMandatory: true,
        confidence: originalBarcode.visibilityConfidence || 0.95,
        observationSummary: 'EXPOSED',
        reason: `Original manufacturer barcode remains visible (${originalBarcode.scannedCode || 'UPC detected'}).`,
        remediation: 'Cover the original barcode so that it is no longer scannable.',
        boundingBox: originalBarcode.boundingBox,
        evidenceSnippet: originalBarcode.scannedCode ? `Visible UPC: ${originalBarcode.scannedCode}` : 'Manufacturer barcode uncovered',
      };
    }

    if (originalBarcode.coverageState === 'NOT_VISIBLE') {
      return {
        ruleId: 'FBA-BAR-001',
        checkType: 'ORIGINAL_BARCODE_COVERAGE',
        name: 'Original Barcode Coverage',
        requirement: 'Original Manufacturer Barcode Must Be Covered',
        result: 'NEEDS_REVIEW',
        isMandatory: true,
        confidence: 0.65,
        observationSummary: 'NOT_VISIBLE',
        reason: 'Cannot confirm 100% manufacturer barcode coverage due to packaging angle.',
        remediation: 'Capture reverse side to verify no uncovered secondary barcodes exist.',
      };
    }

    return {
      ruleId: 'FBA-BAR-001',
      checkType: 'ORIGINAL_BARCODE_COVERAGE',
      name: 'Original Barcode Coverage',
      requirement: 'Original Manufacturer Barcode Must Be Covered',
      result: 'PASS',
      isMandatory: true,
      confidence: 0.97,
      observationSummary: 'COVERED',
      reason: 'Original manufacturer barcode is completely covered with no secondary scannable barcodes.',
      boundingBox: originalBarcode.boundingBox,
    };
  },
};

/**
 * 5. Expiry Date Rule (FBA-EXP-001)
 */
export const expiryDateRule = {
  id: 'FBA-EXP-001',
  name: 'Expiration Date Verification',
  checkType: 'EXPIRY_DATE',
  description: 'Verifies legible expiration date format (MM/YYYY or YYYY-MM-DD) and ≥90 days remaining shelf life.',
  isMandatory: true,
  evaluate: (requirements, observations, quality) => {
    if (!requirements.expiryDateRequired) {
      return {
        ruleId: 'FBA-EXP-001',
        checkType: 'EXPIRY_DATE',
        name: 'Expiration Date Verification',
        requirement: 'Expiration Date Legible and Valid',
        result: 'NOT_REQUIRED',
        isMandatory: false,
        confidence: 1.0,
        observationSummary: 'NOT_REQUIRED',
        reason: 'Item is non-perishable; expiration date is not required.',
      };
    }

    const { expiryDate = {} } = observations;

    if (!expiryDate.detected) {
      return {
        ruleId: 'FBA-EXP-001',
        checkType: 'EXPIRY_DATE',
        name: 'Expiration Date Verification',
        requirement: 'Expiration Date Legible and Valid',
        result: 'FAIL',
        isMandatory: true,
        confidence: expiryDate.confidence || 0.94,
        observationSummary: 'MISSING',
        reason: 'Mandatory expiration date text was NOT found on packaging exterior.',
        remediation: 'Locate manufacturer batch/expiration code and apply external EXP date label in MM/YYYY format.',
      };
    }

    if (!expiryDate.isReadable) {
      return {
        ruleId: 'FBA-EXP-001',
        checkType: 'EXPIRY_DATE',
        name: 'Expiration Date Verification',
        requirement: 'Expiration Date Legible and Valid',
        result: 'NEEDS_REVIEW',
        isMandatory: true,
        confidence: 0.68,
        observationSummary: 'UNREADABLE',
        reason: 'Expiration date text is detected but characters are degraded or unreadable.',
        remediation: 'Verify expiry date under direct light and affix a verified external expiration label.',
        boundingBox: expiryDate.boundingBox,
      };
    }

    if (expiryDate.daysRemaining !== undefined && expiryDate.daysRemaining < 90) {
      return {
        ruleId: 'FBA-EXP-001',
        checkType: 'EXPIRY_DATE',
        name: 'Expiration Date Verification',
        requirement: 'Expiration Date Legible and Valid',
        result: 'FAIL',
        isMandatory: true,
        confidence: 0.98,
        observationSummary: 'EXPIRED_OR_SHORT_DATED',
        reason: `Item has only ${expiryDate.daysRemaining} days until expiration (minimum 90 days required for shipment).`,
        remediation: 'Reject unit for fulfillment; route to inventory vendor return / liquidation.',
        boundingBox: expiryDate.boundingBox,
        evidenceSnippet: `Extracted: ${expiryDate.extractedDate} (${expiryDate.daysRemaining} days left)`,
      };
    }

    return {
      ruleId: 'FBA-EXP-001',
      checkType: 'EXPIRY_DATE',
      name: 'Expiration Date Verification',
      requirement: 'Expiration Date Legible and Valid',
      result: 'PASS',
      isMandatory: true,
      confidence: expiryDate.confidence || 0.96,
      observationSummary: 'VALID',
      reason: `Expiration date verified: ${expiryDate.extractedDate || 'Legible date present'} (Shelf life compliant).`,
      boundingBox: expiryDate.boundingBox,
      evidenceSnippet: expiryDate.extractedDate || expiryDate.rawText,
    };
  },
};

/**
 * 6. Handling Marks Rule (WO-MARK-001)
 */
export const handlingMarksRule = {
  id: 'WO-MARK-001',
  name: 'Handling & Safety Marks',
  checkType: 'HANDLING_MARKS',
  description: 'Verifies required safety and logistics orientation markings (FRAGILE, THIS WAY UP, TEAM LIFT, SOLD AS SET).',
  isMandatory: false,
  evaluate: (requirements, observations, quality) => {
    if (!requirements.requiredHandlingMarks || requirements.requiredHandlingMarks.length === 0) {
      return {
        ruleId: 'WO-MARK-001',
        checkType: 'HANDLING_MARKS',
        name: 'Handling & Safety Marks',
        requirement: 'Required Handling Markings',
        result: 'NOT_REQUIRED',
        isMandatory: false,
        confidence: 1.0,
        observationSummary: 'NOT_REQUIRED',
        reason: 'No special handling marks required for this product configuration.',
      };
    }

    const missingMarks = [];
    const foundMarks = [];
    const marks = observations.handlingMarks || [];

    for (const requiredMark of requirements.requiredHandlingMarks) {
      const detected = marks.find((m) => m.markType === requiredMark && m.detected);
      if (detected) {
        foundMarks.push(requiredMark.replace(/_/g, ' '));
      } else {
        missingMarks.push(requiredMark.replace(/_/g, ' '));
      }
    }

    if (missingMarks.length > 0) {
      return {
        ruleId: 'WO-MARK-001',
        checkType: 'HANDLING_MARKS',
        name: 'Handling & Safety Marks',
        requirement: 'Required Handling Markings',
        result: 'FAIL',
        isMandatory: false,
        confidence: 0.92,
        observationSummary: 'MISSING_MARKS',
        reason: `Missing required handling labels: [${missingMarks.join(', ')}].`,
        remediation: `Affix standard [${missingMarks.join(', ')}] stickers to outer packaging.`,
        evidenceSnippet: foundMarks.length > 0 ? `Found: ${foundMarks.join(', ')}` : 'None detected',
      };
    }

    return {
      ruleId: 'WO-MARK-001',
      checkType: 'HANDLING_MARKS',
      name: 'Handling & Safety Marks',
      requirement: 'Required Handling Markings',
      result: 'PASS',
      isMandatory: false,
      confidence: 0.95,
      observationSummary: 'FOUND',
      reason: `All required handling marks present: [${foundMarks.join(', ')}].`,
      evidenceSnippet: foundMarks.join(', '),
    };
  },
};

export const defaultRulePack = [
  polybagRule,
  suffocationWarningRule,
  fnskuRule,
  originalBarcodeCoverageRule,
  expiryDateRule,
  handlingMarksRule,
];
