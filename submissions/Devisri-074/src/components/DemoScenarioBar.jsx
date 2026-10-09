import React from 'react';
import { DemoScenarios } from '../lib/types';

export default function DemoScenarioBar({ selectedScenario, onSelectScenario }) {
  return (
    <div className="demo-scenario-bar">
      <div className="scenario-bar-title">
        <span className="scenario-badge">TEST HARNESS</span>
        <span className="scenario-text">Select Verification Scenario:</span>
      </div>
      <div className="scenario-buttons-scroll">
        {DemoScenarios.map((sc) => (
          <button
            key={sc.id}
            onClick={() => onSelectScenario(sc.id)}
            className={`scenario-btn ${selectedScenario === sc.id ? 'active' : ''}`}
            title={sc.description}
          >
            {sc.label}
          </button>
        ))}
      </div>
    </div>
  );
}
