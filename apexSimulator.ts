
import { 
  DecorationPayload, PricingResult, Product2, PricebookEntry, 
  ProductEstimatorDecoration, CartItem 
} from './types';
import { MOCK_PRODUCTS, MOCK_PRICEBOOK_ENTRIES, MOCK_DECORATION_RULES } from './mockData';

/**
 * Normalizes decoration codes for case-insensitive lookup, matching the Apex logic.
 */
export const normalizeDeco = (input: string): string => {
  return input ? input.replace(/\s+/g, '').toLowerCase() : '';
};

/**
 * Simulates EstimatorPricingService.calculateUnitPrice
 */
export const calculateUnitPrice = (
  payload: DecorationPayload, 
  quantity: number
): PricingResult => {
  const q = quantity > 0 ? quantity : 1;
  const { sku, designData } = payload;

  // 1) Resolve Product and Pricebook Entry
  const product = MOCK_PRODUCTS.find(p => p.ProductCode === sku);
  if (!product) throw new Error(`Product not found for SKU: ${sku}`);

  const pbe = MOCK_PRICEBOOK_ENTRIES.find(e => e.Product2Id === product.Id && e.IsActive);
  if (!pbe) throw new Error(`Active PricebookEntry not found for SKU: ${sku}`);

  let baseUnit = pbe.UnitPrice;
  let perUnitDecoTotal = 0;
  let totalSetupFee = 0;

  // 2) Extract image-only views & sum decoration add-ons
  designData.forEach(view => {
    // Only price views with images
    if (!view.image || view.image.length === 0) return;

    const viewCode = view.viewCode;
    const decoCode = normalizeDeco(view.decorationCode);

    // Fetch Rule
    const rule = MOCK_DECORATION_RULES.find(r => 
      r.Product__c === product.Id &&
      normalizeDeco(r.DecorationCode__c) === decoCode &&
      r.ViewCode__c === viewCode &&
      (r.MinQty__c === null || q >= r.MinQty__c) &&
      (r.MaxQty__c === null || q <= r.MaxQty__c) &&
      r.IsActive__c
    );

    if (rule) {
      let perUnit = rule.PerUnitAddOn__c;

      // Image specific attributes
      view.image.forEach(img => {
        if (rule.PerColorAddOn__c && img.numberOfColors) {
          perUnit += (rule.PerColorAddOn__c * img.numberOfColors);
        }
        if (rule.PerStitchAddOn__c && img.stitchCount) {
          perUnit += (rule.PerStitchAddOn__c * img.stitchCount);
        }
      });

      perUnitDecoTotal += perUnit;
      if (rule.SetupFee__c) {
        totalSetupFee += rule.SetupFee__c;
      }
    }
  });

  const allocatedSetupPerUnit = totalSetupFee / q;
  const computedUnit = Number((baseUnit + perUnitDecoTotal + allocatedSetupPerUnit).toFixed(2));

  // Generate a mock fingerprint (hash simulation)
  const fingerprint = btoa(`${sku}|${q}|${computedUnit}`).substring(0, 16);

  return {
    product2Id: product.Id,
    pricebookEntryId: pbe.Id,
    baseUnitPrice: baseUnit,
    perUnitDecorationTotal: perUnitDecoTotal,
    allocatedSetupPerUnit: Number(allocatedSetupPerUnit.toFixed(2)),
    computedUnitPrice: computedUnit,
    quantity: q,
    pricingFingerprint: fingerprint
  };
};

/**
 * Simulates the Cart Orchestrator logic (CartExtension.CartCalculate)
 */
export const runCartOrchestrator = (cartItems: CartItem[]): CartItem[] => {
  return cartItems.map(item => {
    // If we have a computed unit price, the orchestrator sets the effective line price to it.
    if (item.ComputedUnitPrice__c) {
      return {
        ...item,
        UnitPrice: item.ComputedUnitPrice__c, // Standard field override
        TotalLineAmount: item.ComputedUnitPrice__c * item.Quantity
      };
    }
    return item;
  });
};
