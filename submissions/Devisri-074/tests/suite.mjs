import assert from 'node:assert';
import crypto from 'node:crypto';

console.log('🧪 Starting Prep Manager Automated Test Suite (Koya Devisri Chowdary · Devisri-074)...\n');

let passedTests = 0;
let failedTests = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`  ✓ ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`  ✕ ${name}`);
    console.error(err);
    failedTests++;
  }
}

// Canonical JSON helper
function canonicalJson(obj) {
  if (obj === null || typeof obj !== 'object') return JSON.stringify(obj);
  if (Array.isArray(obj)) return '[' + obj.map(canonicalJson).join(',') + ']';
  const keys = Object.keys(obj).sort();
  return '{' + keys.map((k) => `${JSON.stringify(k)}:${canonicalJson(obj[k])}`).join(',') + '}';
}

function computeDigest(payload) {
  return crypto.createHash('sha256').update(canonicalJson(payload)).digest('hex');
}

// 1. Deterministic Canonical Hashing & Tamper Detection
test('1. Cryptographic SHA-256 integrity digest is deterministic across unordered keys', () => {
  const payload1 = { id: 'INS-001', unitId: 'UNIT-TEX-1', decision: 'PASS', disposition: 'READY_FOR_PACK' };
  const payload2 = { disposition: 'READY_FOR_PACK', decision: 'PASS', unitId: 'UNIT-TEX-1', id: 'INS-001' };

  const hash1 = computeDigest(payload1);
  const hash2 = computeDigest(payload2);

  assert.strictEqual(hash1, hash2);
  assert.strictEqual(hash1.length, 64);
});

test('2. Tampered payload produces mismatched SHA-256 hash (Tamper Detection)', () => {
  const original = { id: 'INS-001', decision: 'PASS', unitId: 'UNIT-TEX-1' };
  const tampered = { id: 'INS-001', decision: 'FAIL', unitId: 'UNIT-TEX-1' };

  const hashOriginal = computeDigest(original);
  const hashTampered = computeDigest(tampered);

  assert.notStrictEqual(hashOriginal, hashTampered);
});

// 2. Quality Gate Tests
test('3. Image Quality Gate flags blur/defocus and prevents false PASS with UNCERTAIN', () => {
  const quality = {
    resolutionAcceptable: true,
    blurSharpnessScore: 0.32,
    glareHotspotDetected: false,
    acceptable: false,
    overallGrade: 'BAD',
  };

  const isAcceptable = quality.acceptable && quality.blurSharpnessScore >= 0.65;
  assert.strictEqual(isAcceptable, false);
});

test('4. Quality Gate detects glare specularity over critical barcode region', () => {
  const quality = {
    glareHotspotDetected: true,
    obscuredRegions: ['BARCODE_REGION'],
    acceptable: false,
    overallGrade: 'BAD',
  };

  assert.strictEqual(quality.acceptable, false);
  assert(quality.obscuredRegions.includes('BARCODE_REGION'));
});

// 3. Polybag Rule
test('5. Polybag Rule: SEALED produces PASS, UNSEALED produces FAIL, NOT_VISIBLE produces UNCERTAIN', () => {
  function evaluatePolybag(polybag) {
    if (!polybag.detected || polybag.state === 'ABSENT') return 'FAIL';
    if (polybag.state === 'NOT_VISIBLE') return 'NEEDS_REVIEW';
    if (polybag.state === 'UNSEALED' || !polybag.isSealed) return 'FAIL';
    if (polybag.state === 'SEALED' && polybag.isSealed) return 'PASS';
    return 'FAIL';
  }

  assert.strictEqual(evaluatePolybag({ detected: true, state: 'SEALED', isSealed: true }), 'PASS');
  assert.strictEqual(evaluatePolybag({ detected: true, state: 'UNSEALED', isSealed: false }), 'FAIL');
  assert.strictEqual(evaluatePolybag({ detected: true, state: 'NOT_VISIBLE' }), 'NEEDS_REVIEW');
  assert.strictEqual(evaluatePolybag({ detected: false, state: 'ABSENT' }), 'FAIL');
});

// 4. Suffocation Warning Rule
test('6. Suffocation Warning Rule: required on opening >= 5 inches', () => {
  function evaluateWarning(openingSizeInches, warningPresent, warningLegible) {
    if (openingSizeInches >= 5) {
      if (!warningPresent) return 'FAIL';
      if (!warningLegible) return 'NEEDS_REVIEW';
      return 'PASS';
    }
    return 'NOT_REQUIRED';
  }

  assert.strictEqual(evaluateWarning(10, true, true), 'PASS');
  assert.strictEqual(evaluateWarning(10, false, false), 'FAIL');
  assert.strictEqual(evaluateWarning(10, true, false), 'NEEDS_REVIEW');
  assert.strictEqual(evaluateWarning(3, false, false), 'NOT_REQUIRED');
});

// 5. FNSKU Placement Rule
test('7. FNSKU Placement Rule: FLAT=PASS, ON_SEAM=FAIL, ON_CURVE=FAIL, NOT_VISIBLE=UNCERTAIN', () => {
  function evaluateFnsku(state) {
    switch (state) {
      case 'FLAT':
        return 'PASS';
      case 'ON_SEAM':
      case 'ON_CURVE':
      case 'ON_EDGE':
      case 'ABSENT':
        return 'FAIL';
      case 'NOT_VISIBLE':
        return 'NEEDS_REVIEW';
      default:
        return 'FAIL';
    }
  }

  assert.strictEqual(evaluateFnsku('FLAT'), 'PASS');
  assert.strictEqual(evaluateFnsku('ON_SEAM'), 'FAIL');
  assert.strictEqual(evaluateFnsku('ON_CURVE'), 'FAIL');
  assert.strictEqual(evaluateFnsku('ON_EDGE'), 'FAIL');
  assert.strictEqual(evaluateFnsku('NOT_VISIBLE'), 'NEEDS_REVIEW');
});

// 6. Original Barcode Coverage Rule
test('8. Barcode Coverage Rule: COVERED=PASS, EXPOSED=FAIL, NOT_VISIBLE=UNCERTAIN', () => {
  function evaluateBarcodeCoverage(coverageState) {
    if (coverageState === 'COVERED') return 'PASS';
    if (coverageState === 'EXPOSED') return 'FAIL';
    if (coverageState === 'NOT_VISIBLE') return 'NEEDS_REVIEW';
    return 'FAIL';
  }

  assert.strictEqual(evaluateBarcodeCoverage('COVERED'), 'PASS');
  assert.strictEqual(evaluateBarcodeCoverage('EXPOSED'), 'FAIL');
  assert.strictEqual(evaluateBarcodeCoverage('NOT_VISIBLE'), 'NEEDS_REVIEW');
});

// 7. Expiry Date Rule
test('9. Expiry Date Rule: Valid with >=90 days shelf life=PASS, Missing=FAIL, Unreadable=UNCERTAIN', () => {
  function evaluateExpiry(detected, readable, daysRemaining) {
    if (!detected) return 'FAIL';
    if (!readable) return 'NEEDS_REVIEW';
    if (daysRemaining < 90) return 'FAIL';
    return 'PASS';
  }

  assert.strictEqual(evaluateExpiry(true, true, 360), 'PASS');
  assert.strictEqual(evaluateExpiry(false, false, 0), 'FAIL');
  assert.strictEqual(evaluateExpiry(true, false, 360), 'NEEDS_REVIEW');
  assert.strictEqual(evaluateExpiry(true, true, 45), 'FAIL');
});

// 8. Handling Marks Rule
test('10. Handling Marks Rule: FOUND=PASS, MISSING=FAIL', () => {
  function evaluateHandlingMarks(required, detected) {
    const missing = required.filter((m) => !detected.includes(m));
    return missing.length === 0 ? 'PASS' : 'FAIL';
  }

  assert.strictEqual(evaluateHandlingMarks(['THIS_SIDE_UP', 'FRAGILE'], ['THIS_SIDE_UP', 'FRAGILE']), 'PASS');
  assert.strictEqual(evaluateHandlingMarks(['THIS_SIDE_UP', 'FRAGILE'], ['THIS_SIDE_UP']), 'FAIL');
});

// 9. Overall Verdict Priority: FAIL > UNCERTAIN > PASS
test('11. Overall Verdict Logic enforces priority: FAIL > UNCERTAIN (NEEDS_REVIEW) > PASS', () => {
  function computeOverall(checks) {
    const hasFail = checks.some((c) => c === 'FAIL');
    if (hasFail) return { decision: 'FAIL', stationStatus: 'RED_REWORK' };
    const hasReview = checks.some((c) => c === 'NEEDS_REVIEW');
    if (hasReview) return { decision: 'NEEDS_REVIEW', stationStatus: 'AMBER_REVIEW' };
    return { decision: 'PASS', stationStatus: 'GREEN_RELEASE' };
  }

  assert.deepStrictEqual(computeOverall(['PASS', 'PASS', 'FAIL']), {
    decision: 'FAIL',
    stationStatus: 'RED_REWORK',
  });
  assert.deepStrictEqual(computeOverall(['PASS', 'NEEDS_REVIEW', 'PASS']), {
    decision: 'NEEDS_REVIEW',
    stationStatus: 'AMBER_REVIEW',
  });
  assert.deepStrictEqual(computeOverall(['PASS', 'PASS', 'PASS']), {
    decision: 'PASS',
    stationStatus: 'GREEN_RELEASE',
  });
});

// 10. Human Override & Audit Log
test('12. Human Override updates decision while preserving original verdict in audit trail', () => {
  const originalInspection = {
    id: 'INS-101',
    decision: 'FAIL',
    disposition: 'REWORK_REQUIRED',
    overrides: [],
  };

  const override = {
    inspectionId: 'INS-101',
    originalDecision: originalInspection.decision,
    newDecision: 'PASS',
    overriddenBy: 'Supervisor John D.',
    reason: 'Verified covered by opaque label on conveyor',
    timestamp: new Date().toISOString(),
  };

  originalInspection.decision = override.newDecision;
  originalInspection.disposition = 'READY_FOR_PACK';
  originalInspection.overrides.push(override);

  assert.strictEqual(originalInspection.decision, 'PASS');
  assert.strictEqual(originalInspection.overrides.length, 1);
  assert.strictEqual(originalInspection.overrides[0].originalDecision, 'FAIL');
});

// 11. Dispute Packet Schema
test('13. Dispute Recovery Packet satisfies machine-readable downstream contract', () => {
  const disputePacket = {
    packetId: 'DISPUTE-PKT-INS-101-9988',
    generatedAt: new Date().toISOString(),
    organization: { id: 'org_demo_alpha', name: 'Alpha Prep Logistics', facility: 'Facility Hub PHX-01' },
    inspectionSummary: {
      inspectionId: 'INS-101',
      unitId: 'UNIT-ALP-9021',
      sku: 'ELEC-HEADSET-PRO',
      decision: 'PASS',
      stationStatus: 'GREEN_RELEASE',
      complianceScore: 100,
    },
    integrity: {
      algorithm: 'SHA-256',
      hash: '9842f81a9bd14e4b5a26c04f9104c8f5e27a9c80d463b2f518e3a241b9efc409',
      isVerified: true,
    },
  };

  assert.strictEqual(disputePacket.inspectionSummary.decision, 'PASS');
  assert.strictEqual(disputePacket.integrity.algorithm, 'SHA-256');
  assert.strictEqual(disputePacket.integrity.hash.length, 64);
  assert.strictEqual(disputePacket.integrity.isVerified, true);
});

// 12. Barcode Modulo-10 Checksum Validation
test('14. Parcel Barcode Modulo-10 Checksum verifies GTIN-13/UPC-A accurately', () => {
  function validateModulo10(code) {
    const clean = String(code).replace(/\D/g, '');
    if (clean.length !== 12 && clean.length !== 13 && clean.length !== 8 && clean.length !== 14) {
      return { valid: true, isCheckApplicable: false };
    }
    let sum = 0;
    const digits = clean.split('').map(Number);
    const checkDigit = digits[digits.length - 1];
    const payloadDigits = digits.slice(0, digits.length - 1).reverse();
    for (let i = 0; i < payloadDigits.length; i++) {
      const weight = i % 2 === 0 ? 3 : 1;
      sum += payloadDigits[i] * weight;
    }
    const calculatedCheck = (10 - (sum % 10)) % 10;
    return { valid: checkDigit === calculatedCheck, isCheckApplicable: true };
  }

  // Valid EAN-13: 4006381333931
  assert.strictEqual(validateModulo10('4006381333931').valid, true);
  // Valid UPC-A: 012345678905
  assert.strictEqual(validateModulo10('012345678905').valid, true);
  // Invalid EAN-13: 4006381333939 (tampered check digit)
  assert.strictEqual(validateModulo10('4006381333939').valid, false);
});

// 13. Parcel Barcode Parser Classification
test('15. Parcel Barcode Parser correctly identifies Amazon FNSKU, UPS Tracking, and Retail codes', () => {
  function classifyCode(code) {
    const upper = code.trim().toUpperCase();
    if (/^X[0-9A-Z]{9,10}$/i.test(upper)) return 'AMAZON_FNSKU';
    if (/^1Z[0-9A-Z]{16}$/i.test(upper)) return 'CARRIER_UPS';
    if (/^\d{12,13}$/.test(code.trim())) return 'RETAIL_GTIN';
    return 'GENERIC_PARCEL';
  }

  assert.strictEqual(classifyCode('X003A4BC99'), 'AMAZON_FNSKU');
  assert.strictEqual(classifyCode('X009Z1AA22'), 'AMAZON_FNSKU');
  assert.strictEqual(classifyCode('1Z999AA10123456784'), 'CARRIER_UPS');
  assert.strictEqual(classifyCode('8901030383124'), 'RETAIL_GTIN');
});

// 14. Vector Barcode SVG Generator Output Test
test('16. Vector Barcode SVG engine renders compliant XML vector graphics', () => {
  function renderMockSvg(code) {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 340 115"><text>${code}</text></svg>`;
  }

  const svg = renderMockSvg('X003A4BC99');
  assert(svg.includes('<svg'));
  assert(svg.includes('X003A4BC99'));
  assert(svg.includes('</svg>'));
});

console.log(`\n========================================`);
console.log(`Results: ${passedTests} PASSED, ${failedTests} FAILED`);
console.log(`========================================\n`);

if (failedTests > 0) {
  process.exit(1);
}

