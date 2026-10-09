import React from "react";
import { AUTHORITATIVE_RULES } from "../types/rules";
import { IconFileText, IconShieldCheck, IconAlertTriangle } from "./Icons";

export default function RulesReferenceModal() {
  return (
    <div className="rules-reference-page">
      <div className="rules-ref-header">
        <div>
          <h2>Authoritative Packaging & Compliance Standards</h2>
          <p className="rules-ref-subtitle">
            Authoritative regulatory definitions (ISO, 16 CFR, ISTA, FDA) used by the deterministic rule engine. No invented CSV assumptions.
          </p>
        </div>
      </div>

      <div className="rules-cards-grid">
        {AUTHORITATIVE_RULES.map(rule => (
          <div key={rule.id} className="rule-ref-card">
            <div className="rule-ref-top">
              <div className="rule-ref-id-badge">{rule.id}</div>
              <span className={`severity-tag ${rule.severity.toLowerCase()}`}>
                {rule.severity}
              </span>
            </div>

            <h3 className="rule-ref-name">{rule.name}</h3>
            <p className="rule-ref-desc">{rule.description}</p>

            <div className="rule-authoritative-box">
              <span className="box-title">Authoritative Standard Citation:</span>
              <p className="box-body">{rule.authoritativeStandard}</p>
            </div>

            <div className="rule-meta-footer">
              <div className="rule-footer-item">
                <span className="dim-lbl">Classification:</span>
                <span className="val-lbl">{rule.category}</span>
              </div>
              <div className="rule-footer-item">
                <span className="dim-lbl">Non-Compliance Fee:</span>
                <span className="val-lbl fee">{rule.defaultFeeIfNonCompliant}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
