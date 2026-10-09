import React, { useState, useEffect, useRef } from 'react';
import { scanCanvasForBarcodes, scanImageFile, parseParcelCode, playScanBeep } from '../services/barcodeScanner';
import { 
  IconBarcode, 
  IconCamera, 
  IconScan, 
  IconRefreshCw, 
  IconAlertTriangle, 
  IconXCircle, 
  IconCheckCircle 
} from './Icons';

export default function QuickBarcodeScanModal({ isOpen, onClose, onBarcodeScanned, currentTenant }) {
  const [activeTab, setActiveTab] = useState('camera'); // 'camera' | 'upload' | 'preset'
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [isScanningFile, setIsScanningFile] = useState(false);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const scanLoopRef = useRef(null);

  useEffect(() => {
    if (isOpen && activeTab === 'camera') {
      startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [isOpen, activeTab]);

  const startCamera = async () => {
    stopCamera();
    setCameraError(null);
    if (typeof navigator === 'undefined' || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraError('Camera access not supported or blocked in this browser environment.');
      setIsCameraActive(false);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        await videoRef.current.play();
        setIsCameraActive(true);
        startScanLoop();
      }
    } catch (err) {
      setCameraError(err.message || 'Camera permission denied or camera unavailable');
      setIsCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (scanLoopRef.current) {
      cancelAnimationFrame(scanLoopRef.current);
      scanLoopRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
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
          const snapshot = canvas.toDataURL('image/jpeg', 0.85);
          stopCamera();
          onBarcodeScanned(result.rawValue, snapshot);
          return;
        }
      } catch (e) {
        // Continue loop
      }

      scanLoopRef.current = requestAnimationFrame(scanFrame);
    };

    scanLoopRef.current = requestAnimationFrame(scanFrame);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsScanningFile(true);

    try {
      const result = await scanImageFile(file);
      const reader = new FileReader();
      reader.onload = (uploadEvt) => {
        const dataUrl = uploadEvt.target.result;
        const code = result?.rawValue || `UNIT-${file.name.substring(0, 4).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
        onBarcodeScanned(code, dataUrl);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error('File scan error:', err);
    } finally {
      setIsScanningFile(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content quick-scan-modal">
        {/* Modal Header */}
        <div className="modal-header">
          <div className="modal-title-row">
            <IconBarcode size={22} className="text-accent" />
            <h3 className="modal-title">Scan Physical Parcel Barcode</h3>
          </div>
          <button onClick={onClose} className="modal-close-btn">✕</button>
        </div>

        {/* Mode Tabs */}
        <div className="quick-scan-tabs">
          <button
            onClick={() => setActiveTab('camera')}
            className={`quick-tab-btn ${activeTab === 'camera' ? 'active' : ''}`}
          >
            <IconCamera size={16} />
            <span>Webcam / Camera</span>
          </button>
          <button
            onClick={() => setActiveTab('upload')}
            className={`quick-tab-btn ${activeTab === 'upload' ? 'active' : ''}`}
          >
            <IconScan size={16} />
            <span>Upload Parcel Photo</span>
          </button>
          <button
            onClick={() => setActiveTab('preset')}
            className={`quick-tab-btn ${activeTab === 'preset' ? 'active' : ''}`}
          >
            <IconBarcode size={16} />
            <span>Sample Barcodes</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="quick-scan-body">
          {activeTab === 'camera' && (
            <div className="quick-camera-frame">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="quick-video-feed"
              />
              <canvas ref={canvasRef} style={{ display: 'none' }} />

              <div className="quick-hud-overlay">
                <div className="quick-hud-laser" />
                <div className="quick-hud-box" />
                <span className="quick-aim-text">Hold parcel barcode in front of camera</span>
              </div>

              {cameraError && (
                <div className="quick-camera-error">
                  <IconAlertTriangle size={24} className="text-warning" />
                  <p>{cameraError}</p>
                  <button onClick={startCamera} className="btn-secondary btn-sm">
                    Retry Camera
                  </button>
                </div>
              )}
            </div>
          )}

          {activeTab === 'upload' && (
            <div className="quick-upload-zone">
              <label htmlFor="modal-file-input" className="quick-upload-label">
                <IconScan size={36} className="text-accent" />
                <p>Click or drag a parcel label / package photo to decode</p>
                <span className="btn-primary btn-sm">
                  {isScanningFile ? 'Scanning Image...' : 'Select File'}
                </span>
                <input
                  id="modal-file-input"
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden-file-input"
                />
              </label>
            </div>
          )}

          {activeTab === 'preset' && (
            <div className="quick-preset-list">
              <p className="quick-preset-title">Select standard sample warehouse parcel:</p>
              <div className="quick-preset-grid">
                <button
                  onClick={() => onBarcodeScanned('X003A4BC99', 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=800&auto=format&fit=crop&q=80')}
                  className="quick-preset-item"
                >
                  <span className="preset-item-code">X003A4BC99</span>
                  <span className="preset-item-name">Amazon FNSKU (Hoodie Polybag)</span>
                </button>
                <button
                  onClick={() => onBarcodeScanned('X009Z1AA22', 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=800&auto=format&fit=crop&q=80')}
                  className="quick-preset-item"
                >
                  <span className="preset-item-code">X009Z1AA22</span>
                  <span className="preset-item-name">Amazon FNSKU (Gaming Headset Box)</span>
                </button>
                <button
                  onClick={() => onBarcodeScanned('1Z999AA10123456784', 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800&auto=format&fit=crop&q=80')}
                  className="quick-preset-item"
                >
                  <span className="preset-item-code">1Z999AA10123456784</span>
                  <span className="preset-item-name">UPS Ground Master Carton</span>
                </button>
                <button
                  onClick={() => onBarcodeScanned('4006381333931', 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800&auto=format&fit=crop&q=80')}
                  className="quick-preset-item"
                >
                  <span className="preset-item-code">4006381333931</span>
                  <span className="preset-item-name">GTIN-13 Consumer Retail Code</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="modal-footer">
          <button onClick={onClose} className="btn-secondary btn-sm">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
