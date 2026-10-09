import React from "react";
import { 
  IconCheckCircle, 
  IconXCircle, 
  IconAlertTriangle, 
  IconClock, 
  IconEdit,
  IconShieldCheck
} from "./Icons";

export default function CheckDetailCard({ check, onOpenOverride, readOnly = false }) {
  const currentVerdict = check.currentVerdict || check.verdict;
  const isOverridden = check.isOverridden || false;

  const getVerdictConfig = (v) => {
    switch (v) {
      case "PASS":
        return {
          bg: "verdict-pass-bg",
          text: "verdict-pass-text",
          border: "verdict-pass-border",
          icon: <IconCheckCircle size={18} className="text-emerald" />,
          label: "PASS"
        };
      case "FAIL":
        return {
          bg: "verdict-fail-bg",
          text: "verdict-fail-text",
          border: "verdict-fail-border",
          icon: <IconXCircle size={18} className="text-rose" />,
          label: "FAIL"
        };
      case "UNCERTAIN":
        return {
          bg: "verdict-uncertain-bg",
          text: "verdict-uncertain-text",
          border: "verdict-uncertain-border",
          icon: <IconAlertTriangle size={18} className="text-amber" />,
          label: "UNCERTAIN"
        };
      case "PENDING_REVIEW":
      default:
        return {
          bg: "verdict-pending-bg",
          text: "verdict-pending-text",
          border: "verdict-pending-border",
          icon: <IconClock size={18} className="text-indigo" />,
          label: "PENDING REVIEW"
        };
    }
  };

  const vConfig = getVerdictConfig(currentVerdict);

  return (
    <div className={`check-card ${vConfig.border}`}>
      <div className="check-card-header">
        <div className="check-title-group">
          <div className="check-rule-id">{check.ruleId}</div>
          <h4 className="check-rule-name">{check.ruleName}</h4>
        </div>
        <div className="check-header-actions">
          <div className={`verdict-pill ${vConfig.bg} ${vConfig.text}`}>
            {vConfig.icon}
            <span className="font-semibold">{vConfig.label}</span>
          </div>
          {!readOnly && onOpenOverride && (
            <button
              onClick={() => onOpenOverride(check)}
              className="override-btn-trigger"
              title="Record supervisor verdict override"
            >
              <IconEdit size={14} />
              <span>Override</span>
            </button>
          )}
        </div>
      </div>

      <div className="check-card-body">
        {/* Visual Observation */}
        <div className="observation-box">
          <span className="obs-label">Perception Observation:</span>
          <p className="obs-text">{check.observation}</p>
        </div>

        {/* Authoritative Standard Note */}
        {check.evidenceNote && (
          <div className="evidence-note-box">
            <span className="evidence-label">Authoritative Requirement:</span>
            <p className="evidence-text">{check.evidenceNote}</p>
          </div>
        )}

        {/* Confidence & Model Metric */}
        {typeof check.confidence === "number" && (
          <div className="confidence-meter-row">
            <div className="confidence-labels">
              <span className="conf-title">Model Confidence</span>
              <span className="conf-value">{Math.round(check.confidence * 100)}%</span>
            </div>
            <div className="conf-bar-track">
              <div 
                className={`conf-bar-fill ${currentVerdict === "PASS" ? "bg-emerald" : currentVerdict === "FAIL" ? "bg-rose" : "bg-amber"}`}
                style={{ width: `${Math.round(check.confidence * 100)}%` }}
              />
            </div>
          </div>
        )}

        {/* Overridden Audit Banner */}
        {isOverridden && (
          <div className="override-audit-banner">
            <div className="override-banner-title">
              <IconShieldCheck size={16} className="text-amber" />
              <span>Supervisor Override Logged</span>
            </div>
            <div className="override-details-grid">
              <div>
                <span className="dim-label">Original:</span>
                <span className="original-verdict-tag">{check.originalVerdict || check.verdict}</span>
              </div>
              <div>
                <span className="dim-label">Reviewer:</span>
                <span className="reviewer-tag">{check.overriddenBy || "Supervisor"}</span>
              </div>
            </div>
            <div className="override-reason-row">
              <span className="dim-label">Reason:</span>
              <span className="reason-text">"{check.overrideReason}"</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
