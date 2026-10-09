import React from 'react';

/**
 * Inspection Canvas Overlay
 * Renders normalized bounding boxes [ymin, xmin, ymax, xmax] over the unit image
 */
export default function InspectionCanvasOverlay({ imageUrl, boxes = [], isScanning = false }) {
  return (
    <div className="canvas-overlay-container">
      <img src={imageUrl} alt="Inspection Unit" className="canvas-base-image" />

      {/* Render Bounding Boxes */}
      {!isScanning && boxes.map((item, index) => {
        const [ymin, xmin, ymax, xmax] = item.box || [0, 0, 0, 0];
        const top = `${ymin * 100}%`;
        const left = `${xmin * 100}%`;
        const width = `${(xmax - xmin) * 100}%`;
        const height = `${(ymax - ymin) * 100}%`;

        return (
          <div
            key={index}
            className="bounding-box-rect"
            style={{
              top,
              left,
              width,
              height,
              borderColor: item.color || '#38bdf8',
            }}
          >
            <div
              className="bounding-box-tag"
              style={{ backgroundColor: item.color || '#38bdf8' }}
            >
              <span>{item.label}</span>
              <span className="box-conf-tag">{Math.round((item.confidence || 0.95) * 100)}%</span>
            </div>
          </div>
        );
      })}

      {/* Laser Scanning Animation */}
      {isScanning && (
        <div className="inference-scanning-overlay">
          <div className="scanner-laser-bar" />
          <div className="scanner-badge">
            <span className="animate-spin">⚙</span>
            <span>Single-Batch AI Perception & OCR Running...</span>
          </div>
        </div>
      )}
    </div>
  );
}
