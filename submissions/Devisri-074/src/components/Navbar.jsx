import React from "react";
import { TENANTS } from "../types/rules";
import { 
  IconCamera, 
  IconBarcode,
  IconDatabase, 
  IconBarChart, 
  IconFileText, 
  IconLock, 
  IconShieldCheck 
} from "./Icons";

export default function Navbar({ activeTab, setActiveTab, currentTenant, setCurrentTenant, recordCount }) {
  return (
    <header className="navbar-container">
      <div className="navbar-inner">
        {/* Brand & Identity */}
        <div className="brand-section">
          <div className="brand-logo-icon">
            <IconShieldCheck size={26} className="text-accent" />
          </div>
          <div className="brand-text">
            <div className="brand-title-row">
              <h1 className="brand-name">PREP MANAGER</h1>
              <span className="brand-version-badge">v2.4.1</span>
            </div>
            <p className="brand-subtitle">Visual Prep-Compliance & Deterministic Auditing Engine</p>
          </div>
        </div>

        {/* Center Tabs Navigation */}
        <nav className="nav-tabs-wrapper">
          <button 
            className={`nav-tab-btn ${activeTab === "inspect" ? "active" : ""}`}
            onClick={() => setActiveTab("inspect")}
          >
            <IconCamera size={18} />
            <span>Inspection Studio</span>
          </button>
          <button 
            className={`nav-tab-btn ${activeTab === "scanner" ? "active" : ""}`}
            onClick={() => setActiveTab("scanner")}
          >
            <IconBarcode size={18} />
            <span>Barcode Scanner</span>
          </button>
          <button 
            className={`nav-tab-btn ${activeTab === "history" ? "active" : ""}`}
            onClick={() => setActiveTab("history")}
          >
            <IconDatabase size={18} />
            <span>Audit History</span>
            <span className="counter-pill">{recordCount}</span>
          </button>
          <button 
            className={`nav-tab-btn ${activeTab === "analytics" ? "active" : ""}`}
            onClick={() => setActiveTab("analytics")}
          >
            <IconBarChart size={18} />
            <span>Accuracy & Metrics</span>
          </button>
          <button 
            className={`nav-tab-btn ${activeTab === "rules" ? "active" : ""}`}
            onClick={() => setActiveTab("rules")}
          >
            <IconFileText size={18} />
            <span>Authoritative Rules</span>
          </button>
        </nav>

        {/* Tenant Switcher & Isolation Indicator */}
        <div className="tenant-isolation-section">
          <div className="tenant-lock-badge" title="Rule 1: Strict Tenancy Isolation Enforced">
            <IconLock size={14} className="lock-icon" />
            <span className="lock-text">RLS ISOLATION</span>
          </div>
          <div className="tenant-select-container">
            <select
              id="tenant-switcher-select"
              value={currentTenant.id}
              onChange={(e) => {
                const found = TENANTS.find(t => t.id === e.target.value);
                if (found) setCurrentTenant(found);
              }}
              className="tenant-dropdown"
            >
              {TENANTS.map(tenant => (
                <option key={tenant.id} value={tenant.id}>
                  {tenant.name} ({tenant.facility ? (tenant.facility.split(" ")[1] || tenant.facility) : tenant.id})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </header>
  );
}
