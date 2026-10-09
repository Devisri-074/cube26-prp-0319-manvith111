// Authoritative Packaging Rules & Standards Definition
// Reference: Packaging & Labelling Compliance Specifications

export const AUTHORITATIVE_RULES = [
  {
    id: "RULE_BARCODE_01",
    name: "Barcode Scannability & Placement",
    category: "Labelling",
    description: "Barcode must be fully visible, unwrinkled, printed in high contrast, and placed on a flat exterior surface.",
    authoritativeStandard: "ISO/IEC 15416 Grade B minimum; scannable 1D/2D code, minimum 0.25 inch quiet zone on all borders.",
    severity: "CRITICAL",
    defaultFeeIfNonCompliant: "$0.50 / unit"
  },
  {
    id: "RULE_SUFFOCATION_02",
    name: "Polybag Suffocation Warning",
    category: "Safety",
    description: "All polybags with an opening of 5 inches or larger must display a legible suffocation warning.",
    authoritativeStandard: "16 CFR Part 1500; warning printed or labelled on polybag with minimum font size based on bag dimensions.",
    severity: "CRITICAL",
    defaultFeeIfNonCompliant: "$0.75 / unit"
  },
  {
    id: "RULE_CONTAINER_03",
    name: "Container Structural Integrity",
    category: "Packaging",
    description: "Carton/box must be structurally sound without severe dents, punctures, burst seams, or moisture damage.",
    authoritativeStandard: "ISTA 3A / ASTM D4169; rigid corrugate with minimum 32 ECT (Edge Crush Test) or 200 lb burst strength.",
    severity: "HIGH",
    defaultFeeIfNonCompliant: "$1.25 / unit"
  },
  {
    id: "RULE_FRAGILE_04",
    name: "Orientation & Fragile Markings",
    category: "Handling",
    description: "Fragile items and liquid containers must bear 'Fragile' and 'This Side Up' orientation arrows.",
    authoritativeStandard: "ISO 780 Standard Package Handling Symbols; minimum 2 adjacent vertical sides.",
    severity: "MEDIUM",
    defaultFeeIfNonCompliant: "$0.40 / unit"
  },
  {
    id: "RULE_EXPIRATION_05",
    name: "Expiration & Lot Code Visibility",
    category: "Perishable",
    description: "Perishable items must show human-readable expiration dates in MM/DD/YYYY or DD/MM/YYYY format with 36+ pt type.",
    authoritativeStandard: "FDA 21 CFR 101.9 / Retail Inbound Policy; shelf life must exceed minimum 90-day remaining window.",
    severity: "HIGH",
    defaultFeeIfNonCompliant: "$1.50 / unit"
  }
];

export const TENANTS = [
  {
    id: "org_demo_alpha",
    name: "Alpha Prep Logistics",
    facility: "Facility PHX-01 (Phoenix, AZ)",
    badgeColor: "#3b82f6"
  },
  {
    id: "org_demo_bravo",
    name: "Bravo Fulfillment Corp",
    facility: "Facility DFW-04 (Dallas, TX)",
    badgeColor: "#8b5cf6"
  }
];

export const SAMPLE_PRESET_UNITS = [
  {
    id: "UNIT-SAMPLE-001",
    sku: "ELEC-HEADSET-PRO",
    title: "Wireless ANC Gaming Headset (Retail Box)",
    category: "Electronics",
    targetRules: ["RULE_BARCODE_01", "RULE_CONTAINER_03"],
    imageUrl: "https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=600&auto=format&fit=crop&q=80",
    expectedOutcome: "PASS",
    presetScenario: "Compliant standard box with clear scannable barcode and pristine box integrity."
  },
  {
    id: "UNIT-SAMPLE-002",
    sku: "APPR-HOODIE-M",
    title: "Cotton Fleece Hoodie (Polybagged 12x15)",
    category: "Apparel",
    targetRules: ["RULE_BARCODE_01", "RULE_SUFFOCATION_02"],
    imageUrl: "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=600&auto=format&fit=crop&q=80",
    expectedOutcome: "FAIL",
    presetScenario: "Large polybag (12\" opening) missing required suffocation warning label."
  },
  {
    id: "UNIT-SAMPLE-003",
    sku: "BEV-OLIVE-OIL-2PK",
    title: "Organic Extra Virgin Olive Oil (Glass 500ml)",
    category: "Fragile Liquids",
    targetRules: ["RULE_BARCODE_01", "RULE_CONTAINER_03", "RULE_FRAGILE_04", "RULE_EXPIRATION_05"],
    imageUrl: "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=600&auto=format&fit=crop&q=80",
    expectedOutcome: "UNCERTAIN",
    presetScenario: "Partial glare over expiration date stamp; orientation arrow partially obscured by tape."
  },
  {
    id: "UNIT-SAMPLE-004",
    sku: "BEAUTY-LOTION-50",
    title: "Hydrating Face Cream (Cosmetic Tube)",
    category: "Cosmetics",
    targetRules: ["RULE_BARCODE_01", "RULE_EXPIRATION_05"],
    imageUrl: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=600&auto=format&fit=crop&q=80",
    expectedOutcome: "PASS",
    presetScenario: "Full compliance with visible batch code and pristine shrink wrap seal."
  }
];
