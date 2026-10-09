import React, { useState, useEffect, useRef } from 'react';
import { 
  scanCanvasForBarcodes, 
  scanImageFile, 
  parseParcelCode, 
  playScanBeep, 
  generateBarcodeSvg 
} from '../services/barcodeScanner';
import { runPrepInspection } from '../lib/orchestrator';
import { db } from '../lib/db';
import { 
  IconBarcode, 
  IconCamera, 
  IconScan, 
  IconPackage, 
  IconVolume2, 
  IconVolumeX, 
  IconZap, 
  IconCopy, 
  IconCheck, 
  IconRefreshCw, 
  IconShieldCheck, 
  IconAlertTriangle, 
  IconCheckCircle, 
  IconXCircle, 
  IconSparkles, 
  IconTrash2, 
  IconDownload,
  IconLock
} from './Icons';

// Interactive demo parcel presets
const DEMO_PARCEL_PRESETS = [
  {
    id: 'DEMO-FNSKU-01',
    label: 'Amazon FNSKU (Hoodie)',
    code: 'X003A4BC99',
    format: 'CODE_128',
    category: 'Apparel Polybag',
    sku: 'APPR-HOODIE-M',
    imageUrl: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=800&auto=format&fit=crop&q=80',
    description: 'Amazon FBA FNSKU on polybagged apparel unit.'
  },
  {
    id: 'DEMO-FNSKU-02',
    label: 'Amazon FNSKU (Headset Box)',
    code: 'X009Z1AA22',
    format: 'CODE_128',
    category: 'Electronics Retail Box',
    sku: 'ELEC-HEADSET-PRO',
    imageUrl: 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=800&auto=format&fit=crop&q=80',
    description: 'Crisp FNSKU label on rigid retail carton.'
  },
  {
    id: 'DEMO-FNSKU-03',
    label: 'Amazon FNSKU (Olive Oil)',
    code: 'X007K9LL33',
    format: 'CODE_128',
    category: 'Fragile Liquid 2-Pack',
    sku: 'BEV-OLIVE-OIL-2PK',
    imageUrl: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=800&auto=format&fit=crop&q=80',
    description: 'Fragile liquid carton barcode.'
  },
  {
    id: 'DEMO-FNSKU-04',
    label: 'Amazon FNSKU (Face Cream)',
    code: 'X004P8QQ44',
    format: 'CODE_128',
    category: 'Cosmetics Sealed Tube',
    sku: 'BEAUTY-LOTION-50',
    imageUrl: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800&auto=format&fit=crop&q=80',
    description: 'Cosmetic tube barcode.'
  },
  {
    id: 'DEMO-UPS-01',
    label: 'UPS Ground Tracking',
    code: '1Z999AA10123456784',
    format: 'CODE_128',
    category: 'Carrier Freight Parcel',
    sku: 'APPR-HOODIE-M',
    imageUrl: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800&auto=format&fit=crop&q=80',
    description: 'Master inbound carton tracking barcode.'
  },
  {
    id: 'DEMO-FEDEX-01',
    label: 'FedEx Express Package',
    code: '794829103940',
    format: 'CODE_128',
    category: 'Inbound Courier Carton',
    sku: 'ELEC-HEADSET-PRO',
    imageUrl: 'https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?w=800&auto=format&fit=crop&q=80',
    description: 'FedEx express delivery barcode.'
  },
  {
    id: 'DEMO-EAN-01',
    label: 'Retail GTIN EAN-13',
    code: '4006381333931',
    format: 'EAN_13',
    category: 'Consumer Product GTIN',
    sku: 'BEAUTY-LOTION-50',
    imageUrl: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800&auto=format&fit=crop&q=80',
    description: 'Original retail manufacturer GTIN-13.'
  },
  {
    id: 'DEMO-QR-01',
    label: '2D QR Work Order',
    code: 'PREP-WO-ALPHA-2026-98421',
    format: 'QR_CODE',
    category: 'Digital Work Order',
    sku: 'APPR-HOODIE-M',
    imageUrl: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=800&auto=format&fit=crop&q=80',
    description: 'High-density 2D Matrix Work Order parcel tag.'
  }
];

export default function ParcelBarcodeScanner({ currentTenant, onNavigateToInspection, onRecordSaved }) {
  const [activeMode, setActiveMode] = useState('camera'); // 'camera' | 'upload' | 'presets'
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraFacing, setCameraFacing] = useState('environment'); // 'environment' | 'user'
  const [cameraError, setCameraError] = useState(null);
  const [isScanningFrame, setIsScanningFrame] = useState(false);
  
  // Scanned State
  const [lastScannedResult, setLastScannedResult] = useState(null);
  const [parsedParcel, setParsedParcel] = useState(null);
  const [scannedImagePreview, setScannedImagePreview] = useState(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [manualInputCode, setManualInputCode] = useState('');
  const [isExecutingInspection, setIsExecutingInspection] = useState(false);
  const [inspectionResult, setInspectionResult] = useState(null);

  // Scan History Log
  const [scanHistory, setScanHistory] = useState(() => {
    try {
      const saved = localStorage.getItem('prep_parcel_scan_history');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const scanLoopRef = useRef(null);

  // Save scan history
  useEffect(() => {
    try {
      localStorage.setItem('prep_parcel_scan_history', JSON.stringify(scanHistory));
    } catch (e) {
      console.warn('Could not persist scan history', e);
    }
  }, [scanHistory]);

  // Hardware Wedge Scanner Keydown Listener
  useEffect(() => {
    let buffer = '';
    let lastKeyTime = Date.now();

    const handleKeyDown = (e) => {
      // Don't interfere if user is typing into an input/textarea
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) {
        return;
      }

      const now = Date.now();
      if (now - lastKeyTime > 100) {
        buffer = '';
      }
      lastKeyTime = now;

      if (e.key === 'Enter') {
        if (buffer.length >= 3) {
          handleProcessScannedBarcode(buffer, 'HARDWARE_WEDGE_SCANNER');
          buffer = '';
        }
      } else if (e.key.length === 1) {
        buffer += e.key;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentTenant, soundEnabled]);

  // Handle camera start/stop
  useEffect(() => {
    if (activeMode === 'camera') {
      startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [activeMode, cameraFacing]);

  const startCamera = async () => {
    stopCamera();
    setCameraError(null);
    if (typeof navigator === 'undefined' || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraError('Camera access not supported or blocked in this browser environment. You can upload parcel photos or use test presets.');
      setIsCameraActive(false);
      return;
    }

    try {
      const constraints = {
        video: {
          facingMode: cameraFacing,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        await videoRef.current.play();
        setIsCameraActive(true);
        startScanLoop();
      }
    } catch (err) {
      console.warn('Camera access error:', err);
      setCameraError(err.message || 'Unable to access camera. Please check permissions or upload a parcel photo.');
      setIsCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (scanLoopRef.current) {
      cancelAnimationFrame(scanLoopRef.current);
      scanLoopRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  };

  const startScanLoop = () => {
    const scanFrame = async () => {
      if (!videoRef.current || videoRef.current.readyState < 2) {
        scanLoopRef.current = requestAnimationFrame(scanFrame);
        return;
      }

      const canvas = canvasRef.current || document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth || 640;
      canvas.height = videoRef.current.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);

      try {
        const result = await scanCanvasForBarcodes(canvas);
        if (result && result.rawValue) {
          // Capture current frame snapshot as preview
          const snapshotUrl = canvas.toDataURL('image/jpeg', 0.85);
          handleProcessScannedBarcode(result.rawValue, result.format, snapshotUrl, result.boundingBox);
          
          // Brief pause before scanning next to prevent duplicate rapid fire
          setTimeout(() => {
            if (activeMode === 'camera' && isCameraActive) {
              scanLoopRef.current = requestAnimationFrame(scanFrame);
            }
          }, 1800);
          return;
        }
      } catch (e) {
        // Frame scan miss, continue loop
      }

      scanLoopRef.current = requestAnimationFrame(scanFrame);
    };

    scanLoopRef.current = requestAnimationFrame(scanFrame);
  };

  const handleProcessScannedBarcode = (code, format = 'CODE_128', capturedImage = null, box = null) => {
    if (!code) return;
    if (soundEnabled) {
      playScanBeep(true);
    }

    const parsed = parseParcelCode(code, currentTenant.id);
    
    // Choose parcel image preview
    const imageToUse = capturedImage || parsed.matchedProduct?.imageUrl || DEMO_PARCEL_PRESETS[0].imageUrl;

    const resultObj = {
      code,
      format,
      timestamp: new Date().toISOString(),
      organizationId: currentTenant.id,
      boundingBox: box,
      imageUrl: imageToUse,
    };

    setLastScannedResult(resultObj);
    setParsedParcel(parsed);
    setScannedImagePreview(imageToUse);
    setInspectionResult(null);

    // Add to history log
    setScanHistory((prev) => [
      {
        id: `SCAN-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        code,
        format,
        timestamp: new Date().toLocaleTimeString(),
        date: new Date().toLocaleDateString(),
        category: parsed.categoryLabel,
        matchedSku: parsed.matchedProduct?.sku || 'GENERIC_PARCEL',
        matchedName: parsed.matchedProduct?.name || 'Custom Inbound Parcel',
        tenantId: currentTenant.id,
      },
      ...prev.slice(0, 49), // Keep last 50
    ]);
  };

  // Image Upload handler
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsScanningFrame(true);
    try {
      const result = await scanImageFile(file);
      const reader = new FileReader();
      reader.onload = (uploadEvt) => {
        const dataUrl = uploadEvt.target.result;
        if (result && result.rawValue) {
          handleProcessScannedBarcode(result.rawValue, result.format, dataUrl, result.boundingBox);
        } else {
          // If pure CV decoder couldn't find a barcode on this custom image,
          // still allow inspecting it with a synthetic serial
          const generatedSerial = `PARCEL-${file.name.substring(0, 4).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
          handleProcessScannedBarcode(generatedSerial, 'MANUAL_PARCEL_IMAGE', dataUrl);
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error('File scan error:', err);
    } finally {
      setIsScanningFrame(false);
    }
  };

  // Preset Select handler
  const handleSelectPreset = (preset) => {
    handleProcessScannedBarcode(preset.code, preset.format, preset.imageUrl);
  };

  // Direct Execution of Inspection on scanned parcel
  const handleExecuteDirectInspection = async () => {
    if (!lastScannedResult || !parsedParcel) return;
    setIsExecutingInspection(true);

    try {
      const prod = parsedParcel.matchedProduct || db.getProducts(currentTenant.id)[0];
      const output = await runPrepInspection({
        productId: prod?.id,
        sku: prod?.sku || parsedParcel.cleanCode,
        unitId: `UNIT-${parsedParcel.cleanCode}`,
        organizationId: currentTenant.id,
        imageUrls: [scannedImagePreview || prod?.imageUrl],
        demoScenario: 'PERFECT',
        inspectorName: 'Barcode Station Autonomous Inspector #074',
      });

      setInspectionResult(output.inspection);
      if (onRecordSaved) onRecordSaved();
    } catch (err) {
      console.error('Direct inspection error:', err);
    } finally {
      setIsExecutingInspection(false);
    }
  };

  // Send to full Inspection Studio
  const handleSendToInspectionStudio = () => {
    if (!parsedParcel) return;
    const prod = parsedParcel.matchedProduct || db.getProducts(currentTenant.id)[0];
    if (onNavigateToInspection) {
      onNavigateToInspection({
        product: prod,
        unitId: `UNIT-${parsedParcel.cleanCode}`,
        sku: prod?.sku || parsedParcel.cleanCode,
        imageUrl: scannedImagePreview || prod?.imageUrl,
      });
    }
  };

  const handleCopyCode = () => {
    if (parsedParcel?.cleanCode) {
      navigator.clipboard.writeText(parsedParcel.cleanCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  const handleClearHistory = () => {
    setScanHistory([]);
    try {
      localStorage.removeItem('prep_parcel_scan_history');
    } catch {}
  };

  const handleExportCsv = () => {
    if (scanHistory.length === 0) return;
    const headers = ['Scan ID', 'Timestamp', 'Barcode Value', 'Format', 'Category', 'Matched SKU', 'Product Name', 'Tenant'];
    const rows = scanHistory.map(h => [
      h.id,
      h.timestamp,
      `"${h.code}"`,
      h.format,
      `"${h.category}"`,
      `"${h.matchedSku}"`,
      `"${h.matchedName}"`,
      h.tenantId
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `parcel_barcode_scans_${currentTenant.id}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="parcel-scanner-view">
      {/* Top Banner & Station Header */}
      <div className="scanner-header-card">
        <div className="scanner-header-left">
          <div className="scanner-icon-badge">
            <IconBarcode size={28} className="text-accent" />
          </div>
          <div>
            <div className="scanner-title-row">
              <h2 className="scanner-title">High-Speed Parcel Barcode Station</h2>
              <span className="scanner-status-pill">
                <span className="scanner-pulse-dot" />
                LIVE DECODER ACTIVE
              </span>
            </div>
            <p className="scanner-subtitle">
              Scan parcel labels, FNSKU barcodes, carrier tracking numbers, and GTIN-13 tags with sub-100ms multi-format recognition.
            </p>
          </div>
        </div>

        <div className="scanner-header-controls">
          {/* Hardware Wedge Status */}
          <div className="wedge-indicator-pill" title="Hardware USB/Bluetooth laser guns automatically detected on keypress">
            <IconZap size={14} className="text-accent" />
            <span>USB Laser Wedge Ready</span>
          </div>

          {/* Sound Toggle */}
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`sound-toggle-btn ${soundEnabled ? 'active' : ''}`}
            title={soundEnabled ? 'Mute Scan Beep' : 'Unmute Scan Beep'}
          >
            {soundEnabled ? <IconVolume2 size={18} /> : <IconVolumeX size={18} />}
            <span>{soundEnabled ? 'Audio Chime ON' : 'Muted'}</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Viewfinder / Input on Left, Decoded Parcel on Right */}
      <div className="scanner-layout-grid">
        {/* Left Column: Multi-modal Barcode Capture */}
        <div className="scanner-input-column">
          {/* Mode Selector Navigation */}
          <div className="scanner-mode-tabs">
            <button
              onClick={() => setActiveMode('camera')}
              className={`mode-tab-btn ${activeMode === 'camera' ? 'active' : ''}`}
            >
              <IconCamera size={16} />
              <span>Live Camera Scanner</span>
            </button>
            <button
              onClick={() => setActiveMode('upload')}
              className={`mode-tab-btn ${activeMode === 'upload' ? 'active' : ''}`}
            >
              <IconScan size={16} />
              <span>Upload Parcel Photo</span>
            </button>
            <button
              onClick={() => setActiveMode('presets')}
              className={`mode-tab-btn ${activeMode === 'presets' ? 'active' : ''}`}
            >
              <IconPackage size={16} />
              <span>Warehouse Test Presets ({DEMO_PARCEL_PRESETS.length})</span>
            </button>
          </div>

          {/* MODE 1: Live Video Camera Viewfinder */}
          {activeMode === 'camera' && (
            <div className="viewfinder-container">
              <div className="viewfinder-viewport">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="camera-video-feed"
                />
                <canvas ref={canvasRef} style={{ display: 'none' }} />

                {/* Cybernetic HUD Overlay */}
                <div className="viewfinder-hud">
                  <div className="hud-corner top-left" />
                  <div className="hud-corner top-right" />
                  <div className="hud-corner bottom-left" />
                  <div className="hud-corner bottom-right" />
                  <div className="hud-laser-line" />
                  <div className="hud-aim-reticle">
                    <span className="aim-text">ALIGN PARCEL BARCODE IN FRAME</span>
                  </div>
                </div>

                {cameraError && (
                  <div className="camera-error-overlay">
                    <IconAlertTriangle size={32} className="text-warning" />
                    <h4>Camera Not Accessible</h4>
                    <p>{cameraError}</p>
                    <button onClick={startCamera} className="btn-secondary btn-sm">
                      <IconRefreshCw size={14} />
                      <span>Retry Camera</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Camera Action Bar */}
              <div className="camera-controls-bar">
                <div className="camera-info-group">
                  <span className="camera-badge">
                    {cameraFacing === 'environment' ? 'Rear Camera (Macro)' : 'Front / Webcam'}
                  </span>
                </div>
                <div className="camera-buttons-group">
                  <button
                    onClick={() => setCameraFacing(cameraFacing === 'environment' ? 'user' : 'environment')}
                    className="btn-secondary btn-sm"
                  >
                    <IconRefreshCw size={14} />
                    <span>Flip Camera</span>
                  </button>
                  <button
                    onClick={isCameraActive ? stopCamera : startCamera}
                    className={`btn-sm ${isCameraActive ? 'btn-danger' : 'btn-primary'}`}
                  >
                    {isCameraActive ? 'Pause Scanner' : 'Start Camera'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* MODE 2: Parcel Photo Upload Dropzone */}
          {activeMode === 'upload' && (
            <div className="upload-scanner-zone">
              <label className="upload-dropzone-label" htmlFor="scanner-file-upload">
                <div className="dropzone-inner-content">
                  <div className="dropzone-icon-box">
                    <IconScan size={44} className="text-accent" />
                  </div>
                  <h3>Drop Parcel Shipping Label or Product Photo</h3>
                  <p>Supports high-resolution carton photos, polybag stickers, and PDF packing slips (PNG, JPG, WEBP)</p>
                  <span className="dropzone-browse-btn">
                    {isScanningFrame ? (
                      <>
                        <IconRefreshCw size={16} className="animate-spin" />
                        <span>Analyzing Barcode & Symbology...</span>
                      </>
                    ) : (
                      'Select Image File'
                    )}
                  </span>
                </div>
                <input
                  id="scanner-file-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden-file-input"
                />
              </label>
            </div>
          )}

          {/* MODE 3: Warehouse Test Presets */}
          {activeMode === 'presets' && (
            <div className="presets-list-panel">
              <div className="presets-header">
                <h4>Instant 1-Click Parcel Barcode Presets</h4>
                <p>Click any real-world logistics parcel to simulate scanning and visual compliance:</p>
              </div>

              <div className="presets-cards-grid">
                {DEMO_PARCEL_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    onClick={() => handleSelectPreset(preset)}
                    className={`preset-parcel-card ${lastScannedResult?.code === preset.code ? 'active' : ''}`}
                  >
                    <div className="preset-card-top">
                      <span className="preset-category-tag">{preset.category}</span>
                      <span className="preset-format-tag">{preset.format}</span>
                    </div>
                    <div className="preset-code-preview">{preset.code}</div>
                    <div className="preset-title">{preset.label}</div>
                    <p className="preset-desc">{preset.description}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Manual Code Input Wedge Fallback */}
          <div className="manual-input-strip">
            <div className="manual-input-row">
              <IconBarcode size={18} className="text-muted" />
              <input
                type="text"
                value={manualInputCode}
                onChange={(e) => setManualInputCode(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && manualInputCode.trim()) {
                    handleProcessScannedBarcode(manualInputCode.trim(), 'MANUAL_ENTRY');
                    setManualInputCode('');
                  }
                }}
                placeholder="Or manually type barcode value / scan with USB laser gun..."
                className="manual-code-field"
              />
              <button
                onClick={() => {
                  if (manualInputCode.trim()) {
                    handleProcessScannedBarcode(manualInputCode.trim(), 'MANUAL_ENTRY');
                    setManualInputCode('');
                  }
                }}
                className="btn-secondary btn-sm"
              >
                Decode
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Real-time Decoded Parcel & Inspection Bridge */}
        <div className="scanner-result-column">
          {parsedParcel ? (
            <div className="decoded-parcel-card">
              {/* Card Header */}
              <div className="decoded-header">
                <div className="decoded-badge-group">
                  <span className="symbology-badge">{lastScannedResult?.format || 'CODE_128'}</span>
                  <span className="parcel-type-badge">{parsedParcel.categoryLabel}</span>
                  {parsedParcel.checksum.isCheckApplicable && (
                    <span className={`checksum-badge ${parsedParcel.checksum.valid ? 'valid' : 'invalid'}`}>
                      {parsedParcel.checksum.valid ? '✓ Checksum Verified' : '✕ Checksum Mismatch'}
                    </span>
                  )}
                </div>
                <span className="scanned-timestamp">Scanned: {new Date().toLocaleTimeString()}</span>
              </div>

              {/* Raw Barcode Display & SVG Pattern */}
              <div className="barcode-display-section">
                <div className="barcode-value-bar">
                  <div className="barcode-value-text">
                    <span className="barcode-prefix">PARCEL CODE:</span>
                    <strong className="barcode-string">{parsedParcel.cleanCode}</strong>
                  </div>
                  <button
                    onClick={handleCopyCode}
                    className="copy-code-btn"
                    title="Copy Barcode to Clipboard"
                  >
                    {copiedCode ? <IconCheck size={16} className="text-emerald" /> : <IconCopy size={16} />}
                    <span>{copiedCode ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>

                {/* Rendered Barcode Graphic */}
                <div 
                  className="barcode-svg-wrapper"
                  dangerouslySetInnerHTML={{ __html: generateBarcodeSvg(parsedParcel.cleanCode, lastScannedResult?.format) }}
                />
              </div>

              {/* Matched Product Details */}
              <div className="matched-product-section">
                <h4 className="section-subheading">Warehouse Catalog Matching</h4>
                {parsedParcel.matchedProduct ? (
                  <div className="product-match-card">
                    <div className="match-image-frame">
                      <img
                        src={scannedImagePreview || parsedParcel.matchedProduct.imageUrl}
                        alt={parsedParcel.matchedProduct.name}
                        className="match-thumb"
                      />
                    </div>
                    <div className="match-info">
                      <div className="match-sku-row">
                        <span className="match-sku">{parsedParcel.matchedProduct.sku}</span>
                        <span className="match-cat">{parsedParcel.matchedProduct.category}</span>
                      </div>
                      <h5 className="match-name">{parsedParcel.matchedProduct.name}</h5>
                      <div className="match-meta-pills">
                        {parsedParcel.matchedProduct.fnsku && (
                          <span className="meta-pill">FNSKU: <strong>{parsedParcel.matchedProduct.fnsku}</strong></span>
                        )}
                        {parsedParcel.matchedProduct.asin && (
                          <span className="meta-pill">ASIN: <strong>{parsedParcel.matchedProduct.asin}</strong></span>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="generic-parcel-card">
                    <IconPackage size={28} className="text-accent" />
                    <div>
                      <h5>Unregistered / Custom Inbound Parcel</h5>
                      <p>Barcode recognized. You can still run automated compliance checks or create a custom work order.</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons: Navigate to Studio or Run Direct Inspection */}
              <div className="scanner-actions-grid">
                <button
                  onClick={handleSendToInspectionStudio}
                  className="btn-secondary-large"
                >
                  <IconCamera size={18} />
                  <span>Open in Inspection Studio</span>
                </button>

                <button
                  onClick={handleExecuteDirectInspection}
                  disabled={isExecutingInspection}
                  className="btn-primary-large"
                >
                  {isExecutingInspection ? (
                    <>
                      <IconRefreshCw size={18} className="animate-spin" />
                      <span>Evaluating Rule Suite...</span>
                    </>
                  ) : (
                    <>
                      <IconSparkles size={18} />
                      <span>Run Instant Compliance Check</span>
                    </>
                  )}
                </button>
              </div>

              {/* Direct Inspection Result Banner if executed */}
              {inspectionResult && (
                <div className={`direct-inspection-banner ${(inspectionResult.decision || 'pass').toLowerCase()}`}>
                  <div className="direct-banner-header">
                    <div className="direct-banner-icon">
                      {inspectionResult.decision === 'PASS' && <IconCheckCircle size={28} />}
                      {inspectionResult.decision === 'FAIL' && <IconXCircle size={28} />}
                      {['NEEDS_REVIEW', 'UNCERTAIN', 'PENDING_REVIEW'].includes(inspectionResult.decision) && <IconAlertTriangle size={28} />}
                    </div>
                    <div>
                      <h4>Instant Verification: {inspectionResult.decision}</h4>
                      <p>{inspectionResult.overallReason || inspectionResult.disposition}</p>
                    </div>
                  </div>

                  <div className="direct-checks-strip">
                    {inspectionResult.checks?.map((c) => {
                      const checkName = c.name || c.ruleName || c.ruleId || 'Check';
                      const checkVerdict = c.result || c.verdict || 'PASS';
                      return (
                        <div key={c.ruleId || Math.random()} className={`direct-check-pill ${checkVerdict.toLowerCase()}`}>
                          <span>{checkName.split(' ')[0]}: <strong>{checkVerdict}</strong></span>
                        </div>
                      );
                    })}
                  </div>

                  <div className="direct-hash-footer">
                    <IconLock size={12} className="text-muted" />
                    <code>{inspectionResult.recordHash || inspectionResult.contentHash || 'EVD-VALIDATED'}</code>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Empty State */
            <div className="scanner-empty-card">
              <div className="empty-barcode-animation">
                <IconScan size={56} className="text-accent empty-pulse" />
              </div>
              <h3>Awaiting Parcel Barcode</h3>
              <p>
                Point camera at any barcode, drop a parcel image, or select a test preset to instantly decode symbology and link to warehouse compliance.
              </p>

              <div className="supported-formats-box">
                <span className="format-box-title">Supported Symbologies:</span>
                <div className="format-tags-list">
                  <span className="fmt-tag">Code 128</span>
                  <span className="fmt-tag">EAN-13 / UPC-A</span>
                  <span className="fmt-tag">Code 39</span>
                  <span className="fmt-tag">QR Code</span>
                  <span className="fmt-tag">DataMatrix</span>
                  <span className="fmt-tag">Amazon FNSKU</span>
                  <span className="fmt-tag">UPS / FedEx Tracking</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Scanned Parcel History Table */}
      <div className="scan-history-panel">
        <div className="history-panel-header">
          <div className="history-title-row">
            <IconPackage size={18} className="text-accent" />
            <h3>Parcel Scan Audit Log ({scanHistory.length})</h3>
          </div>
          <div className="history-actions-row">
            {scanHistory.length > 0 && (
              <>
                <button onClick={handleExportCsv} className="btn-secondary btn-mini">
                  <IconDownload size={14} />
                  <span>Export CSV</span>
                </button>
                <button onClick={handleClearHistory} className="btn-secondary btn-mini text-danger">
                  <IconTrash2 size={14} />
                  <span>Clear History</span>
                </button>
              </>
            )}
          </div>
        </div>

        {scanHistory.length > 0 ? (
          <div className="history-table-container">
            <table className="scan-history-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Barcode / Parcel Code</th>
                  <th>Symbology</th>
                  <th>Classification</th>
                  <th>Matched Catalog Product</th>
                  <th>Tenant</th>
                  <th>Quick Action</th>
                </tr>
              </thead>
              <tbody>
                {scanHistory.map((item) => (
                  <tr key={item.id}>
                    <td className="time-cell">{item.timestamp}</td>
                    <td className="code-cell">
                      <code>{item.code}</code>
                    </td>
                    <td><span className="table-fmt-badge">{item.format}</span></td>
                    <td className="cat-cell">{item.category}</td>
                    <td className="prod-cell">
                      <strong>{item.matchedSku}</strong>
                      <span className="sub-name">{item.matchedName}</span>
                    </td>
                    <td><span className="table-tenant-tag">{item.tenantId}</span></td>
                    <td>
                      <button
                        onClick={() => handleProcessScannedBarcode(item.code, item.format)}
                        className="btn-secondary btn-mini"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="history-empty-state">
            <p>No parcels scanned in this active session yet. Scanned barcodes will automatically appear in this audit log.</p>
          </div>
        )}
      </div>
    </div>
  );
}
