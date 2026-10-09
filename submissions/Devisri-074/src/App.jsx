import React, { useState, useEffect } from "react";
import Navbar from "./components/Navbar";
import InspectionStudio from "./components/InspectionStudio";
import ParcelBarcodeScanner from "./components/ParcelBarcodeScanner";
import HistoryDashboard from "./components/HistoryDashboard";
import AnalyticsView from "./components/AnalyticsView";
import RulesReferenceModal from "./components/RulesReferenceModal";
import { TENANTS } from "./types/rules";
import { db } from "./lib/db";
import { getTenantRecords } from "./services/storage";

export default function App() {
  const [currentTenant, setCurrentTenant] = useState(TENANTS[0]);
  const [activeTab, setActiveTab] = useState("inspect"); // 'inspect' | 'scanner' | 'history' | 'analytics' | 'rules'
  const [records, setRecords] = useState([]);
  const [prefilledParcel, setPrefilledParcel] = useState(null);

  // Load records whenever tenant changes
  useEffect(() => {
    refreshRecords();
  }, [currentTenant]);

  const refreshRecords = () => {
    const dbRecords = db.getInspections({ organizationId: currentTenant.id });
    const legacyRecords = getTenantRecords(currentTenant.id) || [];
    
    // Merge deduplicated
    const map = new Map();
    [...dbRecords, ...legacyRecords].forEach(r => {
      if (!map.has(r.id)) map.set(r.id, r);
    });
    setRecords(Array.from(map.values()));
  };

  const handleNavigateToInspection = (parcelData) => {
    setPrefilledParcel(parcelData);
    setActiveTab("inspect");
  };

  return (
    <div className="app-root">
      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currentTenant={currentTenant}
        setCurrentTenant={setCurrentTenant}
        recordCount={records.length}
      />

      {/* Main View Router */}
      <main className="main-content-area">
        {activeTab === "inspect" && (
          <InspectionStudio
            currentTenant={currentTenant}
            onRecordSaved={refreshRecords}
            prefilledParcel={prefilledParcel}
          />
        )}

        {activeTab === "scanner" && (
          <ParcelBarcodeScanner
            currentTenant={currentTenant}
            onNavigateToInspection={handleNavigateToInspection}
            onRecordSaved={refreshRecords}
          />
        )}

        {activeTab === "history" && (
          <HistoryDashboard
            records={records}
            currentTenant={currentTenant}
            onOpenOverride={refreshRecords}
          />
        )}

        {activeTab === "analytics" && (
          <AnalyticsView
            records={records}
            currentTenant={currentTenant}
          />
        )}

        {activeTab === "rules" && (
          <RulesReferenceModal />
        )}
      </main>

      {/* Footer Info */}
      <footer className="app-footer">
        <div className="footer-inner">
          <div className="footer-left">
            <span><strong>Prep Manager</strong> • Independent Developer Submission (Koya Devisri Chowdary)</span>
          </div>
          <div className="footer-right">
            <span className="tenant-status-dot" />
            <span>Active Tenant: <strong>{currentTenant.name}</strong> ({currentTenant.id})</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
