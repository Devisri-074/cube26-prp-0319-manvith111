import React, { useState, useEffect } from 'react';
import { runPrepInspection } from '../lib/orchestrator';
import { db } from '../lib/db';
import CheckDetailCard from './CheckDetailCard';
import OverrideModal from './OverrideModal';
import DemoScenarioBar from './DemoScenarioBar';
import InspectionCanvasOverlay from './InspectionCanvasOverlay';
import DisputePacketModal from './DisputePacketModal';
import QuickBarcodeScanModal from './QuickBarcodeScanModal';
import { scanCanvasForBarcodes, scanImageFile, parseParcelCode, playScanBeep } from '../services/barcodeScanner';
import { 
  IconSparkles, 
  IconCamera, 
  IconClock, 
  IconShieldCheck, 
  IconAlertTriangle,
  IconCheckCircle,
  IconXCircle,
  IconRefreshCw,
  IconLock,
  IconDownload,
  IconFileText,
  IconBarcode,
  IconScan,
  IconZap
} from './Icons';

export default function InspectionStudio({ currentTenant, onRecordSaved, prefilledParcel = null }) {
  const products = db.getProducts(currentTenant.id);
  const [selectedProduct, setSelectedProduct] = useState(products[0] || db.getProducts()[0]);
  const [selectedScenario, setSelectedScenario] = useState(selectedProduct?.demoScenario || 'PERFECT');

  const [unitId, setUnitId] = useState(`UNIT-${selectedProduct?.category?.substring(0, 3)?.toUpperCase() || 'ITM'}-9821`);
  const [sku, setSku] = useState(selectedProduct?.sku || 'APPR-HOODIE-M');
  const [imageUrl, setImageUrl] = useState(selectedProduct?.imageUrl || '');
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentResult, setCurrentResult] = useState(null);

  // Quick Barcode Scanner Modal State
  const [quickScanOpen, setQuickScanOpen] = useState(false);
  const [quickScanMode, setQuickScanMode] = useState('camera'); // 'camera' | 'upload'
  const [scannedBadge, setScannedBadge] = useState(null);

  // Modals
  const [overrideModalOpen, setOverrideModalOpen] = useState(false);
  const [targetCheckForOverride, setTargetCheckForOverride] = useState(null);
  const [disputeModalOpen, setDisputeModalOpen] = useState(false);

  const handleSelectProduct = (prod) => {
    if (!prod) return;
    setSelectedProduct(prod);
    setSku(prod.sku || 'APPR-HOODIE-M');
    setImageUrl(prod.imageUrl || '');
    setSelectedScenario(prod.demoScenario || 'PERFECT');
    const catPrefix = prod.category ? prod.category.substring(0, 3).toUpperCase() : 'ITM';
    setUnitId(`UNIT-${catPrefix}-${Math.floor(1000 + Math.random() * 9000)}`);
    setScannedBadge(null);
    setCurrentResult(null);
  };

  // Handle prefilled parcel from Barcode Scanner Tab
  useEffect(() => {
    if (prefilledParcel) {
      if (prefilledParcel.product) {
        setSelectedProduct(prefilledParcel.product);
      }
      if (prefilledParcel.sku) setSku(prefilledParcel.sku);
      if (prefilledParcel.unitId) setUnitId(prefilledParcel.unitId);
      if (prefilledParcel.imageUrl) setImageUrl(prefilledParcel.imageUrl);
      setScannedBadge(prefilledParcel.sku || prefilledParcel.unitId);
      setCurrentResult(null);
    }
  }, [prefilledParcel]);

  // Sync with tenant change
  useEffect(() => {
    const tenantProds = db.getProducts(currentTenant?.id);
    if (tenantProds && tenantProds.length > 0 && (!selectedProduct || selectedProduct.organizationId !== currentTenant?.id)) {
      handleSelectProduct(tenantProds[0]);
    }
  }, [currentTenant]);

  const handleQuickBarcodeScanned = (code, capturedImage = null) => {
    playScanBeep(true);
    const parsed = parseParcelCode(code, currentTenant.id);
    if (parsed.matchedProduct) {
      setSelectedProduct(parsed.matchedProduct);
      setSku(parsed.matchedProduct.sku);
      if (capturedImage) setImageUrl(capturedImage);
      else setImageUrl(parsed.matchedProduct.imageUrl);
    } else {
      setSku(parsed.cleanCode);
      if (capturedImage) setImageUrl(capturedImage);
    }
    setUnitId(`UNIT-${parsed.cleanCode}`);
    setScannedBadge(parsed.cleanCode);
    setQuickScanOpen(false);
    setCurrentResult(null);
  };

  const handleCustomImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (uploadEvent) => {
        const dataUrl = uploadEvent.target.result;
        setImageUrl(dataUrl);
        setUnitId(`UNIT-CUSTOM-${Math.floor(1000 + Math.random() * 9000)}`);
        setCurrentResult(null);

        // Auto-attempt barcode scan from uploaded image
        try {
          const scanRes = await scanImageFile(dataUrl);
          if (scanRes && scanRes.rawValue) {
            handleQuickBarcodeScanned(scanRes.rawValue, dataUrl);
          }
        } catch (err) {
          // ignore
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleExecuteInspection = async () => {
    if (!imageUrl) return;
    setIsProcessing(true);

    try {
      const output = await runPrepInspection({
        productId: selectedProduct?.id,
        sku,
        unitId,
        organizationId: currentTenant.id,
        imageUrls: [imageUrl],
        demoScenario: selectedScenario,
        inspectorName: 'Koya Devisri Chowdary (Inspector #074)',
      });

      setCurrentResult(output.inspection);
      if (onRecordSaved) onRecordSaved();
    } catch (err) {
      console.error('Inspection error:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleOpenOverride = (check) => {
    setTargetCheckForOverride(check);
    setOverrideModalOpen(true);
  };

  const handleSaveOverride = (ruleId, newVerdict, reason, reviewer) => {
    if (!currentResult) return;
    const updated = db.recordOverride(currentResult.id, {
      newDecision: newVerdict,
      ruleId,
      reason,
      overriddenBy: reviewer,
    });
    setCurrentResult({ ...updated });
    if (onRecordSaved) onRecordSaved();
  };

  const boundingBoxes = currentResult?.observations?.detectedObjects || [];

  return (
    <div className="studio-layout">
      {/* Left Column: Capture & Work Order Config */}
      <div className="studio-left-panel">
        <div className="panel-card">
          <div className="panel-header">
            <div className="panel-title-row">
              <IconCamera size={20} className="text-accent" />
              <h2 className="panel-title">Prep Inspection Station</h2>
            </div>
            <div className="panel-header-actions">
              <button
                onClick={() => setQuickScanOpen(true)}
                className="btn-quick-scan"
                title="Scan physical parcel barcode with camera or image"
              >
                <IconBarcode size={16} />
                <span>Scan Parcel Barcode</span>
              </button>
              <span className="tenant-tag">{currentTenant.name}</span>
            </div>
          </div>

          {/* Test Scenario Selector Bar */}
          <DemoScenarioBar
            selectedScenario={selectedScenario}
            onSelectScenario={(sc) => {
              setSelectedScenario(sc);
              setCurrentResult(null);
            }}
          />

          {/* Scanned Parcel Active Banner */}
          {scannedBadge && (
            <div className="scanned-active-banner">
              <div className="scanned-banner-content">
                <IconBarcode size={16} className="text-accent" />
                <span>Active Scanned Parcel: <strong>{scannedBadge}</strong></span>
              </div>
              <button onClick={() => setScannedBadge(null)} className="btn-mini-close">✕</button>
            </div>
          )}

          {/* Product Catalog Presets */}
          <div className="form-group">
            <label className="form-label">Select Warehouse Catalog Item</label>
            <div className="presets-grid">
              {products.map((prod) => (
                <button
                  key={prod.id}
                  onClick={() => handleSelectProduct(prod)}
                  className={`preset-btn ${selectedProduct?.id === prod.id ? 'active' : ''}`}
                >
                  <span className="preset-sku">{prod.sku}</span>
                  <span className="preset-name">{prod.name ? prod.name.split('(')[0] : prod.sku}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Image Canvas with Bounding Box Overlay */}
          <div className="capture-preview-container">
            <div className="image-frame">
              {imageUrl ? (
                <InspectionCanvasOverlay
                  imageUrl={imageUrl}
                  boxes={boundingBoxes}
                  isScanning={isProcessing}
                />
              ) : (
                <div className="empty-capture-state">
                  <IconCamera size={48} className="text-muted" />
                  <p>No capture available</p>
                </div>
              )}
            </div>

            {/* Custom Upload & Quick Scan Bar */}
            <div className="upload-actions-bar">
              <label className="upload-file-btn" htmlFor="custom-image-file-input">
                <IconCamera size={14} />
                <span>Upload Physical Unit Photo</span>
                <input 
                  id="custom-image-file-input"
                  type="file" 
                  accept="image/*" 
                  onChange={handleCustomImageUpload} 
                  className="hidden-file-input" 
                />
              </label>

              <button
                onClick={() => setQuickScanOpen(true)}
                className="btn-secondary btn-sm"
              >
                <IconScan size={14} />
                <span>Scan Barcode</span>
              </button>
            </div>
          </div>

          {/* Metadata Grid */}
          <div className="metadata-grid">
            <div className="form-group">
              <label className="form-label" htmlFor="studio-unit-id-input">Unit Serial ID</label>
              <input 
                id="studio-unit-id-input"
                type="text" 
                value={unitId} 
                onChange={(e) => setUnitId(e.target.value)} 
                className="form-input" 
              />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="studio-sku-input">Product SKU</label>
              <input 
                id="studio-sku-input"
                type="text" 
                value={sku} 
                onChange={(e) => setSku(e.target.value)} 
                className="form-input" 
              />
            </div>
          </div>

          {/* Run Batch Inspection Button */}
          <button
            id="run-inspection-btn"
            onClick={handleExecuteInspection}
            disabled={isProcessing || !imageUrl}
            className="btn-primary-large"
          >
            {isProcessing ? (
              <>
                <IconRefreshCw size={20} className="animate-spin" />
                <span>Running Single-Batch Perception & Rules...</span>
              </>
            ) : (
              <>
                <IconSparkles size={20} />
                <span>Execute Automated Inspection (Rule 2)</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Right Column: Real-time Compliance Verdicts & Evidence Record */}
      <div className="studio-right-panel">
        {currentResult ? (
          <div className="results-container">
            {/* Overall Verdict Banner */}
            <div className={`overall-verdict-banner ${currentResult.decision.toLowerCase()}`}>
              <div className="overall-verdict-left">
                <div className="overall-icon-box">
                  {currentResult.decision === 'PASS' && <IconCheckCircle size={36} />}
                  {currentResult.decision === 'FAIL' && <IconXCircle size={36} />}
                  {['NEEDS_REVIEW', 'UNCERTAIN', 'PENDING_REVIEW'].includes(currentResult.decision) && <IconAlertTriangle size={36} />}
                </div>
                <div>
                  <div className="overall-title-row">
                    <h3 className="overall-verdict-heading">
                      {currentResult.decision}: {currentResult.disposition}
                    </h3>
                    {currentResult.hasOverrides && <span className="override-badge-pill">SUPERVISOR OVERRIDE ACTIVE</span>}
                  </div>
                  <p className="overall-desc">{currentResult.overallReason}</p>
                </div>
              </div>

              {/* Timing & Hash Metatag */}
              <div className="verdict-metrics-box">
                <div className="metric-row">
                  <span className="metric-lbl">Score:</span>
                  <span className="metric-val">{currentResult.complianceScore}%</span>
                </div>
                <div className="metric-row">
                  <span className="metric-lbl">Latency:</span>
                  <span className="metric-val">{currentResult.processingTimeMs}ms</span>
                </div>
              </div>
            </div>

            {/* Quality Gate Status Strip */}
            {currentResult.qualityReport && (
              <div className="quality-gate-strip">
                <div className="quality-gate-title">
                  <IconShieldCheck size={18} className="text-accent" />
                  <span>Image Quality Gate</span>
                </div>
                <div className="quality-metrics-pills">
                  <span className="q-pill">Sharpness: <strong>{currentResult.qualityReport.blur?.sharpnessScore}</strong></span>
                  <span className="q-pill">Resolution: <strong>{currentResult.qualityReport.resolution?.width}x{currentResult.qualityReport.resolution?.height}</strong></span>
                  <span className={`q-status-pill ${currentResult.qualityReport.acceptable ? 'passed' : 'warning'}`}>
                    {currentResult.qualityReport.overallGrade}
                  </span>
                </div>
              </div>
            )}

            {/* Evidence Hash Ribbon with Dispute Packet Trigger */}
            <div className="evidence-hash-ribbon">
              <div className="hash-label-group">
                <IconLock size={14} className="text-muted" />
                <span className="hash-title">Evidence SHA-256 Seal:</span>
                <code className="hash-code-text">{currentResult.recordHash || currentResult.contentHash}</code>
              </div>
              <button
                onClick={() => setDisputeModalOpen(true)}
                className="btn-secondary btn-mini"
              >
                <IconFileText size={14} />
                <span>Dispute Packet</span>
              </button>
            </div>

            {/* Individual Check Cards */}
            <div className="checks-list-container">
              <div className="checks-list-header">
                <h3>Evaluated Compliance Checks ({currentResult.checks?.length})</h3>
                <span className="batch-hint">Deterministic Rule Engine v2.4</span>
              </div>

              <div className="checks-grid">
                {currentResult.checks?.map((check) => (
                  <CheckDetailCard
                    key={check.ruleId}
                    check={{
                      ...check,
                      ruleName: check.name || check.ruleName,
                      observation: check.reason || check.observation,
                      evidenceNote: check.remediation || check.evidenceNote,
                      verdict: check.result || check.verdict,
                    }}
                    onOpenOverride={handleOpenOverride}
                  />
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="studio-empty-prompt">
            <div className="empty-prompt-card">
              <IconSparkles size={48} className="text-accent empty-sparkle" />
              <h3>Ready for Visual Compliance Verification</h3>
              <p>Select a verification scenario from the top harness, then click <strong>"Execute Automated Inspection"</strong> to run multi-angle perception and deterministic rules.</p>
              
              <div className="rules-compliance-checklist">
                <div className="checklist-item">
                  <IconCheckCircle size={16} className="text-emerald" />
                  <span><strong>Rule 1:</strong> Tenancy isolated to {currentTenant.name}</span>
                </div>
                <div className="checklist-item">
                  <IconCheckCircle size={16} className="text-emerald" />
                  <span><strong>Rule 2:</strong> Single-batch evaluation (All checks in 1 inference)</span>
                </div>
                <div className="checklist-item">
                  <IconCheckCircle size={16} className="text-emerald" />
                  <span><strong>Rule 3:</strong> Fail-open error handling enabled</span>
                </div>
                <div className="checklist-item">
                  <IconCheckCircle size={16} className="text-emerald" />
                  <span><strong>Rule 4:</strong> First-class UNCERTAIN verdict handling</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Supervisor Override Modal */}
      <OverrideModal
        isOpen={overrideModalOpen}
        onClose={() => {
          setOverrideModalOpen(false);
          setTargetCheckForOverride(null);
        }}
        check={targetCheckForOverride}
        onSaveOverride={handleSaveOverride}
      />

      {/* Dispute Recovery Packet Modal */}
      <DisputePacketModal
        isOpen={disputeModalOpen}
        onClose={() => setDisputeModalOpen(false)}
        inspection={currentResult}
        currentTenant={currentTenant}
      />

      {/* Quick Parcel Barcode Scanner Modal */}
      <QuickBarcodeScanModal
        isOpen={quickScanOpen}
        onClose={() => setQuickScanOpen(false)}
        onBarcodeScanned={handleQuickBarcodeScanned}
        currentTenant={currentTenant}
      />
    </div>
  );
}
