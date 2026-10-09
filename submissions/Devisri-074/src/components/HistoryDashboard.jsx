import React, { useState } from "react";
import { 
  IconSearch, 
  IconFilter, 
  IconCheckCircle, 
  IconXCircle, 
  IconAlertTriangle, 
  IconClock, 
  IconDownload, 
  IconLock,
  IconEye,
  IconShieldCheck,
  IconFileText
} from "./Icons";
import CheckDetailCard from "./CheckDetailCard";
import DisputePacketModal from "./DisputePacketModal";

export default function HistoryDashboard({ records, currentTenant, onOpenOverride }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selectedRecordForDetail, setSelectedRecordForDetail] = useState(null);
  const [disputeModalRecord, setDisputeModalRecord] = useState(null);

  // Filter records strictly to the active tenant (Rule 1: Tenancy isolation)
  const tenantRecords = records.filter(r => r.organizationId === currentTenant.id || r.orgId === currentTenant.id);

  const filtered = tenantRecords.filter(r => {
    const matchesSearch = 
      r.unitId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.title && r.title.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (r.productName && r.productName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (r.contentHash && r.contentHash.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (r.recordHash && r.recordHash.toLowerCase().includes(searchTerm.toLowerCase()));

    const verdict = r.decision || r.overallVerdict;
    const matchesStatus = 
      statusFilter === "ALL" || 
      (statusFilter === "OVERRIDDEN" && r.hasOverrides) ||
      verdict === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const handleExportJson = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(tenantRecords, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `prep_audit_${currentTenant.id}_${new Date().toISOString().split("T")[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const getVerdictBadge = (verdict, hasOverrides) => {
    switch (verdict) {
      case "PASS":
        return <span className="badge pass"><IconCheckCircle size={14} /> PASS</span>;
      case "FAIL":
        return <span className="badge fail"><IconXCircle size={14} /> FAIL</span>;
      case "NEEDS_REVIEW":
      case "UNCERTAIN":
        return <span className="badge uncertain"><IconAlertTriangle size={14} /> UNCERTAIN</span>;
      case "PENDING_REVIEW":
      default:
        return <span className="badge pending"><IconClock size={14} /> PENDING</span>;
    }
  };

  return (
    <div className="history-container">
      {/* Top Header & Isolation Banner */}
      <div className="history-header">
        <div>
          <div className="history-title-row">
            <h2>Audit History & Traceable Records</h2>
            <span className="tenant-scope-pill">
              <IconLock size={12} /> {currentTenant.name}
            </span>
          </div>
          <p className="history-subtitle">
            Cryptographically sealed records with full check verdicts, supervisor overrides, and image SHA-256 hashes.
          </p>
        </div>

        <button onClick={handleExportJson} className="btn-secondary">
          <IconDownload size={16} />
          <span>Export Audit Log (JSON)</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="filters-bar">
        <div className="search-input-wrapper">
          <IconSearch size={18} className="search-icon" />
          <input
            id="audit-history-search-input"
            type="text"
            placeholder="Search by Unit ID, SKU, title, or SHA-256 hash..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="status-filter-pills">
          {["ALL", "PASS", "FAIL", "NEEDS_REVIEW", "OVERRIDDEN"].map(st => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`filter-pill-btn ${statusFilter === st ? "active" : ""}`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Table of Records */}
      {filtered.length > 0 ? (
        <div className="table-responsive-wrapper">
          <table className="audit-table">
            <thead>
              <tr>
                <th>Unit / Work Order</th>
                <th>Classification</th>
                <th>Overall Verdict</th>
                <th>Checks Summary</th>
                <th>Capture Timestamp</th>
                <th>Evidence SHA-256</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(rec => {
                const finalVerdict = rec.decision || rec.overallVerdict;
                const finalHash = rec.recordHash || rec.contentHash;
                return (
                  <tr key={rec.id} className="audit-row">
                    <td>
                      <div className="unit-cell-main">
                        <span className="unit-id-bold">{rec.unitId}</span>
                        <span className="unit-sku-sub">{rec.sku}</span>
                      </div>
                    </td>
                    <td>
                      <span className="category-tag">{rec.category}</span>
                    </td>
                    <td>
                      <div className="verdict-cell-group">
                        {getVerdictBadge(finalVerdict, rec.hasOverrides)}
                        {rec.hasOverrides && <span className="override-mini-tag">OVERRIDDEN</span>}
                      </div>
                    </td>
                    <td>
                      <div className="checks-mini-bar">
                        {rec.checks?.map(c => {
                          const v = c.currentVerdict || c.result || c.verdict;
                          return (
                            <span
                              key={c.ruleId}
                              title={`${c.name || c.ruleName}: ${v}`}
                              className={`mini-check-dot ${String(v).toLowerCase()}`}
                            />
                          );
                        })}
                        <span className="checks-count-label">{rec.checks?.length} checks</span>
                      </div>
                    </td>
                    <td>
                      <span className="time-text">
                        {new Date(rec.timestamp || rec.capturedAt).toLocaleString()}
                      </span>
                    </td>
                    <td>
                      <code className="table-hash-snippet" title={finalHash}>
                        {finalHash ? `${finalHash.substring(0, 10)}...` : "N/A"}
                      </code>
                    </td>
                    <td>
                      <div className="table-actions-group">
                        <button
                          onClick={() => setSelectedRecordForDetail(rec)}
                          className="view-detail-btn"
                          title="Inspect Record Details"
                        >
                          <IconEye size={14} />
                          <span>Inspect</span>
                        </button>
                        <button
                          onClick={() => setDisputeModalRecord(rec)}
                          className="view-detail-btn"
                          title="Generate Dispute Packet"
                        >
                          <IconFileText size={14} />
                          <span>Packet</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="no-records-state">
          <IconAlertTriangle size={36} className="text-muted" />
          <p>No audit records found matching your filters for <strong>{currentTenant.name}</strong>.</p>
        </div>
      )}

      {/* Record Detail Modal */}
      {selectedRecordForDetail && (
        <div className="modal-overlay">
          <div className="modal-backdrop" onClick={() => setSelectedRecordForDetail(null)} />
          <div className="modal-card modal-card-large">
            <div className="modal-header">
              <div className="modal-title-group">
                <IconShieldCheck size={24} className="text-accent" />
                <div>
                  <h3 className="modal-title">Inspection Record: {selectedRecordForDetail.unitId}</h3>
                  <p className="modal-subtitle">{selectedRecordForDetail.productName || selectedRecordForDetail.title} • {selectedRecordForDetail.sku}</p>
                </div>
              </div>
              <button onClick={() => setSelectedRecordForDetail(null)} className="modal-close-btn">
                ✕
              </button>
            </div>

            <div className="modal-body-scroll">
              <div className="record-detail-top-grid">
                {/* Image */}
                <div className="detail-image-box">
                  <img src={selectedRecordForDetail.imageUrl || selectedRecordForDetail.imageUrls?.[0]} alt="Unit" className="detail-preview-img" />
                </div>
                {/* Meta summary */}
                <div className="detail-meta-list">
                  <div className="detail-meta-item">
                    <span className="meta-k">Tenant Org ID:</span>
                    <span className="meta-v"><code>{selectedRecordForDetail.organizationId || selectedRecordForDetail.orgId}</code></span>
                  </div>
                  <div className="detail-meta-item">
                    <span className="meta-k">Overall Decision:</span>
                    <span className="meta-v">{getVerdictBadge(selectedRecordForDetail.decision || selectedRecordForDetail.overallVerdict)}</span>
                  </div>
                  <div className="detail-meta-item">
                    <span className="meta-k">Compliance Score:</span>
                    <span className="meta-v">{selectedRecordForDetail.complianceScore || 100}%</span>
                  </div>
                  <div className="detail-meta-item">
                    <span className="meta-k">Evidence SHA-256 Digest:</span>
                    <span className="meta-v"><code className="break-all">{selectedRecordForDetail.recordHash || selectedRecordForDetail.contentHash}</code></span>
                  </div>
                </div>
              </div>

              {/* Checks */}
              <div className="modal-checks-section">
                <h4>Check Breakdown ({selectedRecordForDetail.checks?.length})</h4>
                <div className="checks-grid">
                  {selectedRecordForDetail.checks?.map(c => (
                    <CheckDetailCard
                      key={c.ruleId}
                      check={{
                        ...c,
                        ruleName: c.name || c.ruleName,
                        observation: c.reason || c.observation,
                        evidenceNote: c.remediation || c.evidenceNote,
                        verdict: c.currentVerdict || c.result || c.verdict,
                      }}
                      readOnly={true}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button 
                onClick={() => {
                  setDisputeModalRecord(selectedRecordForDetail);
                  setSelectedRecordForDetail(null);
                }} 
                className="btn-secondary"
              >
                <IconFileText size={16} />
                <span>View Dispute Packet</span>
              </button>
              <button onClick={() => setSelectedRecordForDetail(null)} className="btn-primary">
                Close Record
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dispute Recovery Packet Modal */}
      {disputeModalRecord && (
        <DisputePacketModal
          isOpen={!!disputeModalRecord}
          onClose={() => setDisputeModalRecord(null)}
          inspection={disputeModalRecord}
          currentTenant={currentTenant}
        />
      )}
    </div>
  );
}
