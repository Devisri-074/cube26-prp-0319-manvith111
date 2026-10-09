/**
 * Multi-Tenant Database Repository & Lineage Engine
 * Supports tenant isolation, unit history, supervisor overrides, and dispute records
 */

import { resolveProductRequirements } from '../rules/requirements';

const DEFAULT_PRODUCTS = [
  {
    id: 'prod-hoodie-01',
    organizationId: 'org_demo_alpha',
    sku: 'APPR-HOODIE-M',
    asin: 'B08XYZ1234',
    fnsku: 'X003A4BC99',
    name: 'Cotton Fleece Hoodie (Charcoal / Medium)',
    category: 'Apparel',
    imageUrl: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=800&auto=format&fit=crop&q=80',
    demoScenario: 'POLYBAG_FAIL',
    requirements: resolveProductRequirements('Apparel'),
  },
  {
    id: 'prod-headset-02',
    organizationId: 'org_demo_alpha',
    sku: 'ELEC-HEADSET-PRO',
    asin: 'B09ABC5678',
    fnsku: 'X009Z1AA22',
    name: 'Wireless ANC Gaming Headset (Retail Box)',
    category: 'Electronics',
    imageUrl: 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=800&auto=format&fit=crop&q=80',
    demoScenario: 'PERFECT',
    requirements: resolveProductRequirements('Electronics'),
  },
  {
    id: 'prod-olive-oil-03',
    organizationId: 'org_demo_bravo',
    sku: 'BEV-OLIVE-OIL-2PK',
    asin: 'B07DEF9012',
    fnsku: 'X007K9LL33',
    name: 'Organic Extra Virgin Olive Oil (Glass 500ml 2-Pack)',
    category: 'Fragile Liquids',
    imageUrl: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=800&auto=format&fit=crop&q=80',
    demoScenario: 'POOR_IMAGE',
    requirements: resolveProductRequirements('Fragile Liquids'),
  },
  {
    id: 'prod-lotion-04',
    organizationId: 'org_demo_bravo',
    sku: 'BEAUTY-LOTION-50',
    asin: 'B06GHI3456',
    fnsku: 'X004P8QQ44',
    name: 'Hydrating Face Cream (Cosmetic Tube)',
    category: 'Cosmetics',
    imageUrl: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800&auto=format&fit=crop&q=80',
    demoScenario: 'PERFECT',
    requirements: resolveProductRequirements('Cosmetics'),
  },
];

const DEFAULT_WORK_ORDERS = [
  {
    id: 'wo-98421',
    organizationId: 'org_demo_alpha',
    workOrderNumber: 'WO-2026-098421',
    batchSize: 50,
    inspectedCount: 12,
    passedCount: 10,
    failedCount: 2,
    status: 'IN_PROGRESS',
    assignedStation: 'STATION-01',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: 'wo-98422',
    organizationId: 'org_demo_bravo',
    workOrderNumber: 'WO-2026-098422',
    batchSize: 100,
    inspectedCount: 45,
    passedCount: 42,
    failedCount: 3,
    status: 'IN_PROGRESS',
    assignedStation: 'STATION-04',
    createdAt: new Date(Date.now() - 43200000).toISOString(),
  },
];

class MemoryDatabase {
  constructor() {
    this.products = [...DEFAULT_PRODUCTS];
    this.workOrders = [...DEFAULT_WORK_ORDERS];
    this.inspections = [];
    this.auditLogs = [];
    this.loadFromStorage();
  }

  loadFromStorage() {
    if (typeof localStorage !== 'undefined') {
      try {
        const rawInspections = localStorage.getItem('prep_db_inspections');
        if (rawInspections) this.inspections = JSON.parse(rawInspections);
      } catch (e) {
        console.warn('LocalStorage unavailable or parse error', e);
      }
    }
  }

  persistStorage() {
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem('prep_db_inspections', JSON.stringify(this.inspections));
      } catch (e) {
        console.warn('LocalStorage save error', e);
      }
    }
  }

  // Multi-Tenant Scoped Lookups
  getProducts(orgId) {
    if (!orgId) return this.products;
    return this.products.filter(p => p.organizationId === orgId);
  }

  getProductById(id) {
    return this.products.find(p => p.id === id);
  }

  getProductBySku(sku) {
    return this.products.find(p => p.sku === sku);
  }

  getWorkOrders(orgId) {
    if (!orgId) return this.workOrders;
    return this.workOrders.filter(w => w.organizationId === orgId);
  }

  getInspections(query = {}) {
    let list = [...this.inspections];
    if (query.organizationId) {
      list = list.filter(i => i.organizationId === query.organizationId);
    }
    if (query.unitId) {
      list = list.filter(i => i.unitId === query.unitId);
    }
    if (query.status) {
      list = list.filter(i => i.decision === query.status || i.overallVerdict === query.status);
    }
    return list.sort((a, b) => new Date(b.timestamp || b.capturedAt) - new Date(a.timestamp || a.capturedAt));
  }

  getInspectionById(id) {
    return this.inspections.find(i => i.id === id);
  }

  saveInspection(record) {
    const idx = this.inspections.findIndex(i => i.id === record.id);
    if (idx >= 0) {
      this.inspections[idx] = record;
    } else {
      this.inspections.unshift(record);
    }
    this.persistStorage();
    return record;
  }

  // Record Supervisor Override with audit logging
  recordOverride(inspectionId, overridePayload) {
    const inspection = this.getInspectionById(inspectionId);
    if (!inspection) throw new Error(`Inspection ${inspectionId} not found`);

    const originalDecision = inspection.decision || inspection.overallVerdict;
    inspection.decision = overridePayload.newDecision;
    inspection.overallVerdict = overridePayload.newDecision;
    inspection.disposition = overridePayload.newDecision === 'PASS' ? 'READY_FOR_PACK' : 'REWORK_REQUIRED';
    inspection.stationStatus = overridePayload.newDecision === 'PASS' ? 'GREEN_RELEASE' : 'RED_REWORK';

    const overrideEntry = {
      inspectionId,
      originalDecision,
      newDecision: overridePayload.newDecision,
      ruleId: overridePayload.ruleId,
      reason: overridePayload.reason,
      overriddenBy: overridePayload.overriddenBy || 'Supervisor',
      timestamp: new Date().toISOString(),
    };

    inspection.overrides = inspection.overrides || [];
    inspection.overrides.push(overrideEntry);
    inspection.overrideHistory = inspection.overrideHistory || [];
    inspection.overrideHistory.push(overrideEntry);
    inspection.hasOverrides = true;

    this.saveInspection(inspection);
    return inspection;
  }
}

export const db = new MemoryDatabase();
