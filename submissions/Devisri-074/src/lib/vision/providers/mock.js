/**
 * Mock / Local Demo Vision Provider
 * Generates realistic perceptual tokens and coordinates for test scenarios
 */

import { evaluateImageQuality } from '../quality';

export class MockVisionProvider {
  constructor() {
    this.name = 'Local Demo Vision Provider';
    this.version = 'v2.4-deterministic';
  }

  async analyze(imageUrls, context = {}) {
    const scenario = context.demoScenario || 'PERFECT';
    const isPolybagCategory = ['Apparel', 'Plush', 'Liquids', 'Clothing'].includes(context.productCategory);

    // 1. Evaluate simulated Quality Gate
    const quality = evaluateImageQuality({
      width: 1920,
      height: 1080,
      isSimulatedBlur: scenario === 'POOR_IMAGE',
      isSimulatedGlare: scenario === 'POOR_IMAGE',
      glareRegions: scenario === 'POOR_IMAGE' ? ['BARCODE_REGION'] : [],
    });

    // 2. Synthesize Perceptual Observations based on scenario
    let polybag = {
      detected: isPolybagCategory || scenario === 'POLYBAG_FAIL',
      state: scenario === 'POLYBAG_FAIL' ? 'UNSEALED' : 'SEALED',
      isSealed: scenario !== 'POLYBAG_FAIL',
      sealType: 'HEAT_SEAL',
      openingSizeInches: 12,
      thicknessMil: 1.5,
      hasPuncturesOrTears: false,
      confidence: 0.96,
      boundingBox: [0.08, 0.12, 0.92, 0.88],
    };

    let suffocationWarning = {
      detected: isPolybagCategory && scenario !== 'WARNING_FAIL',
      textPresent: scenario !== 'WARNING_FAIL',
      textLegible: scenario !== 'POOR_IMAGE',
      fontSizePt: 14,
      isBilingual: true,
      rawText: 'WARNING: To avoid danger of suffocation, keep away from babies and children.',
      confidence: scenario === 'WARNING_FAIL' ? 0.98 : 0.95,
      boundingBox: scenario !== 'WARNING_FAIL' ? [0.42, 0.28, 0.58, 0.72] : undefined,
    };

    let fnsku = {
      detected: true,
      placementState: scenario === 'FNSKU_SEAM_FAIL' ? 'ON_SEAM' : 'FLAT',
      isReadable: scenario !== 'POOR_IMAGE',
      scannedCode: context.expectedFnsku || 'X003A4BC99',
      barcodeSymbology: 'Code-128',
      confidence: 0.97,
      boundingBox: [0.65, 0.35, 0.85, 0.65],
    };

    let originalBarcode = {
      detected: true,
      coverageState: scenario === 'BARCODE_FAIL' ? 'EXPOSED' : 'COVERED',
      isCoveredCompletely: scenario !== 'BARCODE_FAIL',
      scannedCode: scenario === 'BARCODE_FAIL' ? '079357318924' : undefined,
      visibilityConfidence: 0.96,
      boundingBox: [0.15, 0.68, 0.35, 0.88],
    };

    let expiryDate = {
      detected: true,
      isReadable: scenario !== 'POOR_IMAGE',
      extractedDate: '2027-11-30',
      rawText: 'EXP 11/2027 LOT# M9902',
      daysRemaining: 410,
      confidence: 0.94,
      boundingBox: [0.78, 0.15, 0.88, 0.45],
    };

    let handlingMarks = [
      {
        markType: 'THIS_SIDE_UP',
        detected: true,
        orientation: 'UPRIGHT',
        confidence: 0.95,
        boundingBox: [0.12, 0.15, 0.28, 0.32],
      },
      {
        markType: 'FRAGILE',
        detected: true,
        confidence: 0.94,
        boundingBox: [0.12, 0.35, 0.28, 0.52],
      },
    ];

    return {
      provider: this.name,
      modelVersion: this.version,
      quality,
      observations: {
        polybag,
        suffocationWarning,
        fnsku,
        originalBarcode,
        expiryDate,
        handlingMarks,
      },
    };
  }
}
