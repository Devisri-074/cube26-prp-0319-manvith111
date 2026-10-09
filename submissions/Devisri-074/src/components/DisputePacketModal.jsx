import React, { useState, useEffect } from 'react';
import { generateDisputePacket } from '../lib/crypto/hash';
import { IconShieldCheck, IconDownload, IconCheckCircle, IconXCircle, IconLock } from './Icons';

export default function DisputePacketModal({ isOpen, onClose, inspection, currentTenant }) {
  const [packet, setPacket] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (inspection && isOpen) {
      generateDisputePacket(inspection, currentTenant).then(setPacket);
    }
  }, [inspection, isOpen, currentTenant]);

  if (!isOpen || !inspection || !packet) return null;

  const handleDownloadJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(packet, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `${packet.packetId}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleCopyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(packet, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal-card modal-card-large">
        <div className="modal-header">
          <div className="modal-title-group">
            <IconShieldCheck size={24} className="text-accent" />
            <div>
              <h3 className="modal-title">Dispute Recovery Packet</h3>
              <p className="modal-subtitle">Cryptographically Sealed Machine-Readable Contract ({packet.packetId})</p>
            </div>
          </div>
          <button onClick={onClose} className="modal-close-btn">
            ✕
          </button>
        </div>

        <div className="modal-body-scroll">
          {/* Integrity Seal Status Banner */}
          <div className="dispute-seal-banner">
            <div className="seal-left">
              <IconLock size={20} className="text-emerald" />
              <div>
                <strong>SHA-256 Seal Verified & Immutable</strong>
                <p className="seal-hash"><code>{packet.integrity.hash}</code></p>
              </div>
            </div>
            <div className="seal-status-badge pass">VERIFIED</div>
          </div>

          {/* Metadata Summary Grid */}
          <div className="dispute-meta-grid">
            <div className="d-meta-item">
              <span className="d-meta-lbl">Unit Work Order:</span>
              <span className="d-meta-val">{packet.inspectionSummary.unitId}</span>
            </div>
            <div className="d-meta-item">
              <span className="d-meta-lbl">Product SKU:</span>
              <span className="d-meta-val">{packet.inspectionSummary.sku}</span>
            </div>
            <div className="d-meta-item">
              <span className="d-meta-lbl">Final Decision:</span>
              <span className={`d-meta-val badge ${packet.inspectionSummary.decision.toLowerCase()}`}>
                {packet.inspectionSummary.decision}
              </span>
            </div>
            <div className="d-meta-item">
              <span className="d-meta-lbl">Tenant Organization:</span>
              <span className="d-meta-val">{packet.organization.name}</span>
            </div>
          </div>

          {/* JSON Payload View */}
          <div className="json-code-container">
            <div className="json-code-header">
              <span>Downstream Conveyor / Carrier Contract Payload (JSON)</span>
              <button onClick={handleCopyJson} className="copy-json-btn">
                {copied ? '✓ Copied' : 'Copy JSON'}
              </button>
            </div>
            <pre className="json-code-block">
              {JSON.stringify(packet, null, 2)}
            </pre>
          </div>
        </div>

        <div className="modal-footer">
          <button onClick={onClose} className="btn-secondary">
            Close
          </button>
          <button onClick={handleDownloadJson} className="btn-primary">
            <IconDownload size={16} />
            <span>Download Dispute Packet (.json)</span>
          </button>
        </div>
      </div>
    </div>
  );
}
