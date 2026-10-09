/**
 * Deterministic Compliance Rules Engine
 * Implements strict policy evaluation, priority logic, and compliance scoring
 */

import { defaultRulePack } from './rulePacks/prep';

export class RulesEngine {
  constructor(rules = defaultRulePack) {
    this.rules = rules;
  }

  evaluate(requirements, observations, quality, context = {}) {
    const checks = [];
    const remediationList = [];

    // 1. Evaluate each active compliance rule deterministically
    for (const rule of this.rules) {
      const checkResult = rule.evaluate(requirements, observations, quality, context);
      checks.push(checkResult);

      if (checkResult.remediation && ['FAIL', 'NEEDS_REVIEW'].includes(checkResult.result)) {
        remediationList.push(checkResult.remediation);
      }
    }

    // 2. Compute summary counts
    const total = checks.length;
    const passed = checks.filter((c) => c.result === 'PASS').length;
    const failed = checks.filter((c) => c.result === 'FAIL').length;
    const underReview = checks.filter((c) => c.result === 'NEEDS_REVIEW').length;
    const notRequired = checks.filter((c) => c.result === 'NOT_REQUIRED').length;

    // 3. Compute Compliance Score (Active rules only)
    const evaluatedCount = total - notRequired;
    const complianceScore =
      evaluatedCount > 0 ? Math.round((passed / evaluatedCount) * 100) : 100;

    // 4. Overall Decision Priority: FAIL > NEEDS_REVIEW > PASS
    const hasFail = checks.some((c) => c.result === 'FAIL');
    const hasNeedsReview = checks.some((c) => c.result === 'NEEDS_REVIEW');

    let decision;
    let stationStatus;
    let disposition;
    let overallReason;

    if (hasFail) {
      decision = 'FAIL';
      stationStatus = 'RED_REWORK';
      disposition = 'REWORK_REQUIRED';
      const failReasons = checks.filter((c) => c.result === 'FAIL').map((c) => c.reason);
      overallReason = `Non-compliant unit (${failed} violations). Issues: ${failReasons.join('; ')}`;
    } else if (hasNeedsReview) {
      decision = 'NEEDS_REVIEW';
      stationStatus = 'AMBER_REVIEW';
      disposition = 'HOLD_FOR_REVIEW';
      const reviewReasons = checks.filter((c) => c.result === 'NEEDS_REVIEW').map((c) => c.reason);
      overallReason = `Uncertain / review needed (${underReview} checks). Details: ${reviewReasons.join('; ')}`;
    } else {
      decision = 'PASS';
      stationStatus = 'GREEN_RELEASE';
      disposition = 'READY_FOR_PACK';
      overallReason = `Unit is 100% compliant across all ${evaluatedCount} applicable packaging standards.`;
    }

    return {
      decision,
      stationStatus,
      disposition,
      complianceScore,
      overallReason,
      remediationList,
      summary: {
        total,
        passed,
        failed,
        underReview,
        notRequired,
      },
      checks,
    };
  }
}

export const defaultRuleEngine = new RulesEngine();
