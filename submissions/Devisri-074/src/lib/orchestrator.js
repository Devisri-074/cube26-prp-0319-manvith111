/**
 * Prep Manager Orchestrator
 * Coordinates the full end-to-end visual compliance verification pipeline:
 * Load requirements -> Quality Gate -> Single-batch Vision inference -> Deterministic Rules Engine -> SHA-256 Seal -> DB Storage -> Downstream Dispatch
 */

import { db } from './db';
import { resolveProductRequirements } from './rules/requirements';
import { defaultRuleEngine } from './rules/engine';
import { executeVisionInspection } from './vision/provider';
import { computeEvidenceSeal } from './crypto/hash';
import { compileDetectedObjectBoxes } from './vision/observations';

export async function runPrepInspection(input = {}) {
  const startTime = Date.now();

  // 1. Resolve Organization & Product
  const organizationId = input.organizationId || 'org_demo_alpha';

  let product;
  if (input.productId) {
    product = db.getProductById(input.productId);
  } else if (input.sku) {
    product = db.getProductBySku(input.sku);
  }

  if (!product) {
    const products = db.getProducts(organizationId);
    product = products[0] || db.getProducts()[0];
  }

  const unitId =
    input.unitId ||
    `UNIT-${product.category.substring(0, 3).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
  const sku = input.sku || product.sku;
  const asin = product.asin || 'B08XYZ9999';
  const fnsku = product.fnsku || 'X003A4BC99';
  const workOrderId = input.workOrderId || 'wo-98421';
  const imageUrls =
    input.imageUrls && input.imageUrls.length > 0
      ? input.imageUrls
      : [
          product.imageUrl ||
            'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=800&auto=format&fit=crop&q=80',
        ];

  // Prior attempt lookup
  const priorInspections = db.getInspections({ unitId });
  const attemptNumber =
    input.attemptNumber || (priorInspections.length > 0 ? priorInspections.length + 1 : 1);
  const parentInspectionId =
    input.parentInspectionId ||
    (priorInspections.length > 0 ? priorInspections[0].id : undefined);

  // 2. Resolve Product Prep Requirements
  const requirements = product.requirements || resolveProductRequirements(product.category);

  // 3. Vision & OCR Perceptual Observation Layer (Single-Batch)
  const visionStartTime = Date.now();
  const visionResponse = await executeVisionInspection(
    {
      imageUrls,
      productCategory: product.category,
      expectedSku: sku,
      expectedFnsku: fnsku,
      expectedAsin: asin,
      demoScenario: input.demoScenario || product.demoScenario || 'PERFECT',
    },
    { providerType: input.providerType || 'LOCAL_DEMO' }
  );
  const aiLatencyMs = Date.now() - visionStartTime;

  const quality = visionResponse.quality;
  const observations = visionResponse.observations;

  // Compile visual bounding boxes for UI overlay
  observations.detectedObjects = compileDetectedObjectBoxes(observations);

  // 4. Deterministic Compliance Rules Engine Evaluation
  const ruleEvaluation = defaultRuleEngine.evaluate(
    requirements,
    observations,
    quality,
    { expectedFnsku: fnsku, sku }
  );

  const inspectionId = `INS-${String(Date.now()).substring(7)}`;
  const timestamp = new Date().toISOString();

  // 5. Compute SHA-256 Cryptographic Audit Seal & Evidence ID
  const { recordHash, evidenceId } = await computeEvidenceSeal({
    id: inspectionId,
    unitId,
    sku,
    fnsku,
    decision: ruleEvaluation.decision,
    disposition: ruleEvaluation.disposition,
    timestamp,
    checks: ruleEvaluation.checks,
    imageHashes: [imageUrls[0]?.substring(0, 32)],
  });

  const totalProcessingTime = Date.now() - startTime;

  // 6. Build Final Immutable Inspection Record
  const inspectionRecord = {
    id: inspectionId,
    organizationId,
    unitId,
    productId: product.id,
    sku,
    asin,
    fnsku,
    productName: product.name,
    category: product.category,
    workOrderId,
    stationId: 'STATION-01',
    inspector: input.inspectorName || 'Alex Rivera (Operator)',
    operatorRole: input.inspectorRole || 'OPERATOR',
    timestamp,
    attemptNumber,
    parentInspectionId,
    decision: ruleEvaluation.decision,
    overallVerdict: ruleEvaluation.decision,
    stationStatus: ruleEvaluation.stationStatus,
    complianceScore: ruleEvaluation.complianceScore,
    disposition: ruleEvaluation.disposition,
    overallReason: ruleEvaluation.overallReason,
    remediationList: ruleEvaluation.remediationList,
    requirementsApplied: requirements,
    checks: ruleEvaluation.checks,
    qualityReport: quality,
    observations,
    imageUrl: imageUrls[0],
    imageUrls,
    evidenceId,
    contentHash: recordHash,
    recordHash,
    isSealed: true,
    sealedAt: timestamp,
    provider: visionResponse.provider || 'LOCAL_DEMO',
    modelVersion: visionResponse.modelVersion || 'v2.4.1',
    processingTimeMs: totalProcessingTime,
    aiLatencyMs: Math.max(aiLatencyMs, 45),
    auditLogs: [
      {
        action: 'INSPECTION_CREATED',
        user: input.inspectorName || 'Alex Rivera',
        timestamp,
        details: `Initial decision: ${ruleEvaluation.decision} (${ruleEvaluation.stationStatus})`,
      },
      {
        action: 'SEAL_GENERATED_SHA256',
        user: 'SYSTEM_SEALER',
        timestamp,
        details: `Digest: ${recordHash}`,
      },
    ],
  };

  // 7. Store in DB
  db.saveInspection(inspectionRecord);

  // 8. Build Downstream Agent Payload
  const downstreamPayload = {
    unitId,
    sku,
    fnsku,
    decision: ruleEvaluation.decision,
    stationStatus: ruleEvaluation.stationStatus,
    disposition: ruleEvaluation.disposition,
    evidenceId,
    integrityHash: recordHash,
    checkedAt: timestamp,
    stationId: 'STATION-01',
    checksPassed: ruleEvaluation.summary.passed,
    checksFailed: ruleEvaluation.summary.failed,
    checksUnderReview: ruleEvaluation.summary.underReview,
    actionRequired:
      ruleEvaluation.remediationList[0] ||
      (ruleEvaluation.decision === 'PASS'
        ? 'Proceed to pack station'
        : 'Route unit to rework table'),
  };

  return {
    inspection: inspectionRecord,
    downstreamPayload,
    success: true,
  };
}
