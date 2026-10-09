/**
 * Product Prep Requirements Resolver
 * Maps product categories to authoritative warehouse prep requirements
 */

export function resolveProductRequirements(category) {
  switch (category) {
    case 'Apparel':
    case 'Clothing':
    case 'Plush':
      return {
        polybagRequired: true,
        suffocationWarningRequired: true,
        fnskuRequired: true,
        coverOriginalBarcode: true,
        expiryDateRequired: false,
        requiredHandlingMarks: [],
      };

    case 'Liquids':
    case 'Fragile Liquids':
    case 'Glassware':
      return {
        polybagRequired: true,
        suffocationWarningRequired: true,
        fnskuRequired: true,
        coverOriginalBarcode: true,
        expiryDateRequired: true,
        requiredHandlingMarks: ['THIS_SIDE_UP', 'FRAGILE'],
      };

    case 'Perishable':
    case 'Grocery':
    case 'Cosmetics':
    case 'Beauty':
      return {
        polybagRequired: false,
        suffocationWarningRequired: false,
        fnskuRequired: true,
        coverOriginalBarcode: true,
        expiryDateRequired: true,
        requiredHandlingMarks: [],
      };

    case 'Electronics':
    case 'Standard Box':
    default:
      return {
        polybagRequired: false,
        suffocationWarningRequired: false,
        fnskuRequired: true,
        coverOriginalBarcode: true,
        expiryDateRequired: false,
        requiredHandlingMarks: [],
      };
  }
}
