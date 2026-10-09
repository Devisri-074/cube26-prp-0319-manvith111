import React, { useState } from "react";
import { IconShieldCheck, IconXCircle } from "./Icons";

export default function OverrideModal({ isOpen, onClose, check, onSaveOverride }) {
  if (!isOpen || !check) return null;

  const originalVerdict = check.originalVerdict || check.verdict;
  const currentVerdict = check.currentVerdict || check.verdict;

  const [selectedVerdict, setSelectedVerdict] = useState(
    currentVerdict === "PASS" ? "FAIL" : "PASS"
  );
  const [reviewerName, setReviewerName] = useState("Supervisor John D.");
  const [overrideReason, setOverrideReason] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!overrideReason.trim()) {
      setError("Please provide a mandatory rationale for auditing integrity.");
      return;
    }
    setError("");
    onSaveOverride(check.ruleId, selectedVerdict, overrideReason.trim(), reviewerName.trim());
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal-card">
        <div className="modal-header">
          <div className="modal-title-group">
            <IconShieldCheck size={24} className="text-accent" />
            <div>
              <h3 className="modal-title">Supervisor Override</h3>
              <p className="modal-subtitle">{check.ruleName} ({check.ruleId})</p>
            </div>
          </div>
          <button onClick={onClose} className="modal-close-btn">
            <IconXCircle size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          {/* Audit Integrity Notice */}
          <div className="audit-notice-box">
            <strong>Rule Compliance Notice:</strong> Original verdict <code>{originalVerdict}</code> will be immutably preserved in the audit log alongside this override reason.
          </div>

          {/* New Verdict Selection */}
          <div className="form-group">
            <label className="form-label">New Target Verdict</label>
            <div className="verdict-radio-group">
              {["PASS", "FAIL", "UNCERTAIN"].map((v) => (
                <button
                  type="button"
                  key={v}
                  onClick={() => setSelectedVerdict(v)}
                  className={`verdict-select-btn ${selectedVerdict === v ? "selected " + v.toLowerCase() : ""}`}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>

          {/* Reviewer Identifier */}
          <div className="form-group">
            <label className="form-label" htmlFor="reviewer-name-input">Supervisor / Inspector ID</label>
            <input
              id="reviewer-name-input"
              type="text"
              value={reviewerName}
              onChange={(e) => setReviewerName(e.target.value)}
              className="form-input"
              placeholder="e.g. Inspector #482 (Jane Doe)"
              required
            />
          </div>

          {/* Mandatory Override Reason */}
          <div className="form-group">
            <label className="form-label" htmlFor="override-reason-input">
              Mandatory Audit Justification <span className="text-rose">*</span>
            </label>
            <textarea
              id="override-reason-input"
              value={overrideReason}
              onChange={(e) => {
                setOverrideReason(e.target.value);
                if (error) setError("");
              }}
              className="form-textarea"
              placeholder="Explain physical inspection observation (e.g. Warning text verified physically on underside fold; camera reflection obscured date code)..."
              rows={4}
              required
            />
            {error && <p className="form-error-msg">{error}</p>}
          </div>

          {/* Action Buttons */}
          <div className="modal-footer">
            <button type="button" onClick={onClose} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              Confirm & Commit Override
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
