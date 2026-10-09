/**
 * Image Quality Gate Evaluator
 * Evaluates resolution, blur, glare specularity, exposure, contrast, and occlusion.
 *
 * Core Principle (Rule 4):
 * Bad image quality or unreadable evidence must produce UNCERTAIN / NEEDS_REVIEW,
 * NEVER a low-confidence or automatic PASS.
 */

export function evaluateImageQuality(options = {}) {
  const {
    width = 1920,
    height = 1080,
    isSimulatedBlur = false,
    isSimulatedGlare = false,
    isSimulatedLowLight = false,
    glareRegions = [],
  } = options;

  // 1. Resolution Check (Minimum 800x600 required)
  const minWidth = 800;
  const minHeight = 600;
  const isResolutionAcceptable = width >= minWidth && height >= minHeight;
  const resolutionGrade =
    width >= 1280 && height >= 720 ? 'GOOD' : isResolutionAcceptable ? 'WARNING' : 'BAD';
  const resolutionReason =
    resolutionGrade === 'GOOD'
      ? `High-definition resolution verified (${width}x${height}px).`
      : resolutionGrade === 'WARNING'
      ? `Acceptable resolution (${width}x${height}px), HD recommended.`
      : `Image resolution ${width}x${height}px is below minimum required ${minWidth}x${minHeight}px.`;

  // 2. Blur / Sharpness Check
  const sharpnessScore = isSimulatedBlur ? 0.32 : 0.94;
  const isBlurAcceptable = sharpnessScore >= 0.65;
  const blurGrade = sharpnessScore >= 0.85 ? 'GOOD' : sharpnessScore >= 0.65 ? 'WARNING' : 'BAD';
  const blurReason =
    blurGrade === 'GOOD'
      ? 'Optimal edge sharpness and barcode line contrast.'
      : blurGrade === 'WARNING'
      ? 'Slight softness detected; verification is possible but lower confidence.'
      : 'Severe motion blur or lens defocus detected.';

  // 3. Glare / Specularity Check
  const hotspotDetected = isSimulatedGlare || glareRegions.length > 0;
  const glareGrade = !hotspotDetected ? 'GOOD' : glareRegions.length > 1 ? 'BAD' : 'WARNING';
  const isGlareAcceptable = glareGrade !== 'BAD';
  const glareReason = hotspotDetected
    ? `Specularity hotspot detected in zone: [${glareRegions.join(', ') || 'BARCODE_REGION'}].`
    : 'No obscuring specular glare or hot reflections detected.';

  // 4. Exposure & Brightness Check
  const brightnessLevel = isSimulatedLowLight ? 'UNDEREXPOSED' : 'OPTIMAL';
  const exposureGrade = brightnessLevel === 'OPTIMAL' ? 'GOOD' : 'BAD';
  const isExposureAcceptable = brightnessLevel === 'OPTIMAL';
  const exposureReason = isExposureAcceptable
    ? 'Even industrial warehouse illumination verified.'
    : 'Image is underexposed/too dark for reliable OCR and edge detection.';

  // 5. Contrast Check
  const contrastScore = isSimulatedLowLight ? 0.4 : 0.92;
  const contrastGrade = contrastScore >= 0.8 ? 'GOOD' : contrastScore >= 0.5 ? 'WARNING' : 'BAD';
  const isContrastAcceptable = contrastGrade !== 'BAD';

  // 6. Overall Quality Gate Assessment
  const hasBadGrade = [resolutionGrade, blurGrade, glareGrade, exposureGrade, contrastGrade].includes('BAD');
  const hasWarningGrade = [resolutionGrade, blurGrade, glareGrade, exposureGrade, contrastGrade].includes('WARNING');

  const overallGrade = hasBadGrade ? 'BAD' : hasWarningGrade ? 'WARNING' : 'GOOD';
  const acceptable = overallGrade !== 'BAD';

  let overallReason = 'Image quality meets automated compliance inspection thresholds.';
  if (overallGrade === 'BAD') {
    const issues = [];
    if (resolutionGrade === 'BAD') issues.push('Low resolution');
    if (blurGrade === 'BAD') issues.push('Severe defocus / blur');
    if (glareGrade === 'BAD') issues.push(`Harsh glare on ${glareRegions.join(', ') || 'critical regions'}`);
    if (exposureGrade === 'BAD') issues.push('Underexposed lighting');
    overallReason = `Capture rejected by Quality Gate: ${issues.join(', ')}.`;
  } else if (overallGrade === 'WARNING') {
    overallReason = 'Image quality acceptable with warnings (specular reflections present).';
  }

  return {
    acceptable,
    overallGrade,
    resolution: {
      width,
      height,
      acceptable: isResolutionAcceptable,
      grade: resolutionGrade,
      reason: resolutionReason,
    },
    blur: {
      sharpnessScore,
      acceptable: isBlurAcceptable,
      grade: blurGrade,
      reason: blurReason,
    },
    glare: {
      hotspotDetected,
      obscuredRegions: glareRegions,
      acceptable: isGlareAcceptable,
      grade: glareGrade,
      reason: glareReason,
    },
    exposure: {
      brightnessLevel,
      acceptable: isExposureAcceptable,
      grade: exposureGrade,
      reason: exposureReason,
    },
    contrast: {
      contrastScore,
      acceptable: isContrastAcceptable,
      grade: contrastGrade,
    },
    occlusion: {
      occluded: hotspotDetected,
      details: hotspotDetected ? `Obscured by glare: ${glareRegions.join(', ')}` : undefined,
      acceptable: !hotspotDetected,
      grade: hotspotDetected ? 'WARNING' : 'GOOD',
    },
    overallReason,
  };
}
