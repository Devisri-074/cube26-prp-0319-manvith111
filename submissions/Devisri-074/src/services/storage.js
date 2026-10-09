// Tenant-isolated storage service with SHA-256 tamper-evident content hashing

const STORAGE_KEY_PREFIX = "prep_mgr_tenant_records_";
const AUDIT_LOG_KEY_PREFIX = "prep_mgr_audit_log_";

/**
 * Compute SHA-256 hash of a string or buffer for tamper-evidence
 */
export async function computeSha256(contentString) {
  try {
    const encoder = new TextEncoder();
    const data = encoder.encode(contentString);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
  } catch {
    // Deterministic fallback for non-crypto environments
    let hash = 0;
    for (let i = 0; i < contentString.length; i++) {
      const char = contentString.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash |= 0;
    }
    return "hash_" + Math.abs(hash).toString(16).padStart(16, "0");
  }
}

/**
 * Get all inspection records scoped strictly to an organisation ID
 */
export function getTenantRecords(orgId) {
  if (!orgId) return [];
  const raw = localStorage.getItem(`${STORAGE_KEY_PREFIX}${orgId}`);
  if (!raw) return getInitialSeedRecords(orgId);
  try {
    return JSON.parse(raw);
  } catch (e) {
    console.error("Failed to parse tenant records", e);
    return [];
  }
}

/**
 * Save an inspection record strictly scoped to an organisation ID
 */
export function saveTenantRecord(orgId, record) {
  if (!orgId || !record) return;
  const current = getTenantRecords(orgId);
  const index = current.findIndex(r => r.id === record.id);
  
  let updated;
  if (index >= 0) {
    updated = [...current];
    updated[index] = record;
  } else {
    updated = [record, ...current];
  }
  
  localStorage.setItem(`${STORAGE_KEY_PREFIX}${orgId}`, JSON.stringify(updated));
  
  // Also log audit event
  logAuditEvent(orgId, {
    action: index >= 0 ? "RECORD_UPDATED" : "RECORD_CREATED",
    recordId: record.id,
    unitId: record.unitId,
    orgId,
    overallVerdict: record.overallVerdict,
    timestamp: new Date().toISOString()
  });

  return updated;
}

/**
 * Record a supervisor override with mandatory reason tracking
 */
export function recordOverride(orgId, recordId, checkId, newVerdict, overrideReason, reviewerName) {
  const records = getTenantRecords(orgId);
  const record = records.find(r => r.id === recordId);
  if (!record) throw new Error("Record not found in this tenant context");

  const checkIndex = record.checks.findIndex(c => c.ruleId === checkId);
  if (checkIndex === -1) throw new Error("Check rule not found in record");

  const targetCheck = record.checks[checkIndex];
  const previousVerdict = targetCheck.currentVerdict || targetCheck.verdict;

  // Update check with override details
  const updatedChecks = [...record.checks];
  updatedChecks[checkIndex] = {
    ...targetCheck,
    isOverridden: true,
    originalVerdict: targetCheck.originalVerdict || targetCheck.verdict,
    currentVerdict: newVerdict,
    overrideReason,
    overriddenBy: reviewerName || "Supervisor",
    overriddenAt: new Date().toISOString()
  };

  // Re-evaluate overall verdict
  const hasFail = updatedChecks.some(c => (c.currentVerdict || c.verdict) === "FAIL");
  const hasUncertain = updatedChecks.some(c => ["UNCERTAIN", "PENDING_REVIEW"].includes(c.currentVerdict || c.verdict));
  
  const newOverallVerdict = hasFail ? "FAIL" : (hasUncertain ? "UNCERTAIN" : "PASS");

  const updatedRecord = {
    ...record,
    checks: updatedChecks,
    overallVerdict: newOverallVerdict,
    hasOverrides: true,
    lastModified: new Date().toISOString(),
    overrideHistory: [
      ...(record.overrideHistory || []),
      {
        checkId,
        checkName: targetCheck.ruleName,
        fromVerdict: previousVerdict,
        toVerdict: newVerdict,
        reason: overrideReason,
        reviewer: reviewerName || "Supervisor",
        timestamp: new Date().toISOString()
      }
    ]
  };

  saveTenantRecord(orgId, updatedRecord);
  return updatedRecord;
}

/**
 * Audit log recording
 */
export function logAuditEvent(orgId, event) {
  const key = `${AUDIT_LOG_KEY_PREFIX}${orgId}`;
  const raw = localStorage.getItem(key);
  const logs = raw ? JSON.parse(raw) : [];
  const newLogs = [event, ...logs].slice(0, 100);
  localStorage.setItem(key, JSON.stringify(newLogs));
}

export function getTenantAuditLogs(orgId) {
  const key = `${AUDIT_LOG_KEY_PREFIX}${orgId}`;
  const raw = localStorage.getItem(key);
  return raw ? JSON.parse(raw) : [];
}

/**
 * Initial seed data providing realistic evaluation baseline
 */
function getInitialSeedRecords(orgId) {
  const isAlpha = orgId === "org_demo_alpha";
  
  const seed = isAlpha ? [
    {
      id: "REC-ALPHA-101",
      orgId: "org_demo_alpha",
      unitId: "UNIT-ALP-9021",
      sku: "ELEC-KBD-MECH",
      title: "RGB Mechanical Keyboard - US Layout",
      category: "Electronics",
      imageUrl: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=600&auto=format&fit=crop&q=80",
      contentHash: "8a4f91e4c9e83b12876541fce32a0c492bd8409391ab1024e03b22cfd8919a3b",
      ruleVersion: "v2.4.1",
      modelBatchTimeMs: 382,
      capturedAt: new Date(Date.now() - 3600000 * 4).toISOString(),
      overallVerdict: "PASS",
      qualityGate: { passed: true, blurScore: 0.94, lightingScore: 0.91, resolution: "1920x1080" },
      checks: [
        {
          ruleId: "RULE_BARCODE_01",
          ruleName: "Barcode Scannability & Placement",
          verdict: "PASS",
          confidence: 0.98,
          observation: "Barcode 1D Code-128 is crisp, high-contrast, with >0.3in quiet zone on carton side.",
          evidenceNote: "Authoritative ISO/IEC 15416 Grade A verified."
        },
        {
          ruleId: "RULE_CONTAINER_03",
          ruleName: "Container Structural Integrity",
          verdict: "PASS",
          confidence: 0.95,
          observation: "Carton intact, rigid corners, no punctures or structural deformation detected.",
          evidenceNote: "Meets ISTA-3A integrity standard."
        }
      ]
    },
    {
      id: "REC-ALPHA-102",
      orgId: "org_demo_alpha",
      unitId: "UNIT-ALP-9022",
      sku: "APPR-JACKET-WNT",
      title: "Waterproof Winter Puffer Jacket",
      category: "Apparel",
      imageUrl: "https://images.unsplash.com/photo-1544923246-77307dd654cb?w=600&auto=format&fit=crop&q=80",
      contentHash: "4c7a102e3b9f87d41098bca4321d8490aef94021bc89456201a39fbc749102c1",
      ruleVersion: "v2.4.1",
      modelBatchTimeMs: 410,
      capturedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
      overallVerdict: "FAIL",
      qualityGate: { passed: true, blurScore: 0.88, lightingScore: 0.86, resolution: "1920x1080" },
      checks: [
        {
          ruleId: "RULE_BARCODE_01",
          ruleName: "Barcode Scannability & Placement",
          verdict: "PASS",
          confidence: 0.92,
          observation: "FNSKU barcode label attached clearly to bag exterior.",
          evidenceNote: "Scannable Code-128 barcode present."
        },
        {
          ruleId: "RULE_SUFFOCATION_02",
          ruleName: "Polybag Suffocation Warning",
          verdict: "FAIL",
          confidence: 0.96,
          observation: "Polybag opening measures approx 14 inches, but no suffocation warning text or sticker is detected.",
          evidenceNote: "Violation of 16 CFR Part 1500 (mandatory for bags with >= 5 inch opening)."
        }
      ]
    }
  ] : [
    {
      id: "REC-BRAVO-201",
      orgId: "org_demo_bravo",
      unitId: "UNIT-BRV-4410",
      sku: "BEV-TEA-MATCH-ORG",
      title: "Ceremonial Grade Matcha Powder (100g Tin)",
      category: "Perishable",
      imageUrl: "https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=600&auto=format&fit=crop&q=80",
      contentHash: "1e89f41b2c490a07851d23456fe890acbd74102938475a1b029384bcda719283",
      ruleVersion: "v2.4.1",
      modelBatchTimeMs: 395,
      capturedAt: new Date(Date.now() - 3600000 * 5).toISOString(),
      overallVerdict: "PASS",
      qualityGate: { passed: true, blurScore: 0.92, lightingScore: 0.89, resolution: "1920x1080" },
      checks: [
        {
          ruleId: "RULE_BARCODE_01",
          ruleName: "Barcode Scannability & Placement",
          verdict: "PASS",
          confidence: 0.99,
          observation: "EAN-13 barcode clearly printed on base with required quiet zone.",
          evidenceNote: "ISO/IEC standard verified."
        },
        {
          ruleId: "RULE_EXPIRATION_05",
          ruleName: "Expiration & Lot Code Visibility",
          verdict: "PASS",
          confidence: 0.94,
          observation: "Laser etched EXP 11/2027 LOT# M9902 clearly visible.",
          evidenceNote: "FDA 21 CFR compliant date format (>18 months remaining window)."
        }
      ]
    }
  ];

  localStorage.setItem(`${STORAGE_KEY_PREFIX}${orgId}`, JSON.stringify(seed));
  return seed;
}
