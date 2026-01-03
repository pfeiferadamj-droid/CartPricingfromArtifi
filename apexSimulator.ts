
import { 
  DecorationPayload, PricingResult, Product2, PricebookEntry, 
  Product_Estimator_Decoration__c, CartItem 
} from './types';
import { MOCK_PRODUCTS, MOCK_PRICEBOOK_ENTRIES, MOCK_DECORATION_RULES, SHOP_DEFAULTS } from './mockData';

export const normalizeDeco = (input: string): string => {
  return input ? input.replace(/\s+/g, '').toUpperCase() : '';
};

/**
 * Simulates EstimatorPricingService.calculateUnitPrice:
 * 1. Resolve Auth Price Book and Decoration ProductCodes from metadata.
 * 2. Resolve Main Product (Garment) and Base Price.
 * 3. Resolve Decoration Products by matching metadata codes to Product2.ProductCode.
 * 4. Front Logic: If 3D, find Rule where Decoration__c (lookup) == Resolved 3D Prod ID.
 * 5. Location Logic: For other views, add UnitPrice of the resolved Decoration Product's PBE.
 */
export const calculateUnitPrice = (
  payload: DecorationPayload, 
  quantity: number
): PricingResult => {
  const q = quantity > 0 ? quantity : 1;
  const { sku, designData } = payload;
  const logs: string[] = [];

  // 1) Resolve Config from Metadata
  const authPricebookId = SHOP_DEFAULTS.Authenticated_Price_Book_ID__c;
  const flatDecoCode = normalizeDeco(SHOP_DEFAULTS.Flat_Embroidery_Product_Code__c);
  const threeDDecoCode = normalizeDeco(SHOP_DEFAULTS.ThreeD_Embroidery_Product_Code__c);

  logs.push(`Resolved Price Book ID: ${authPricebookId} from Shop_Defaults metadata.`);
  logs.push(`Metadata Config: 3D Code [${threeDDecoCode}], Flat Code [${flatDecoCode}]`);

  // 2) Resolve Primary Product (Garment)
  const mainProduct = MOCK_PRODUCTS.find(p => p.ProductCode === sku);
  if (!mainProduct) throw new Error(`Product not found for SKU: ${sku}`);

  const basePbe = MOCK_PRICEBOOK_ENTRIES.find(e => 
    e.Product2Id === mainProduct.Id && 
    e.Pricebook2Id === authPricebookId && 
    e.IsActive
  );
  if (!basePbe) throw new Error(`No active PricebookEntry for main SKU in Auth Price Book.`);
  
  const baseUnitPrice = basePbe.UnitPrice;
  logs.push(`Starting Base Price: $${baseUnitPrice.toFixed(2)}`);

  let decorationOverride = 0;
  let additionalLocationTotal = 0;

  // 3) Front Decoration Logic (3D Override via Lookup)
  const frontView = designData.find(v => v.viewCode === 'FRONT');
  const frontDecoCodeInput = normalizeDeco(frontView?.decorationCode || '');
  
  // Helper: Find decoration product by checking code against metadata config
  const resolveDecoProduct = (inputCode: string) => MOCK_PRODUCTS.find(p => p.ProductCode === inputCode);

  if (frontDecoCodeInput === threeDDecoCode) {
    const decoProd = resolveDecoProduct(threeDDecoCode);
    if (decoProd) {
      // Find rule where Decoration__c (Lookup) matches the 3D Product ID from metadata
      const overrideRule = MOCK_DECORATION_RULES.find(r => 
        r.Product__c === mainProduct.Id && 
        r.Decoration__c === decoProd.Id &&
        r.IsActive__c
      );
      if (overrideRule) {
        decorationOverride = overrideRule.Override_Price__c;
        logs.push(`Front 3D Embroidery detected. Resolved Rule for Deco Product ID ${decoProd.Id}. Adding Override: $${decorationOverride.toFixed(2)}`);
      } else {
        logs.push(`Front 3D Embroidery detected but no lookup rule found for Product ID ${decoProd.Id} on this item.`);
      }
    }
  } else {
    logs.push(`Front decoration is ${frontView?.decorationCode || 'NONE'}. Standard base price maintained.`);
  }

  // 4) Other Locations Logic (BACK, LEFT, RIGHT)
  const otherViews = designData.filter(v => v.viewCode !== 'FRONT' && v.image && v.image.length > 0);
  otherViews.forEach(view => {
    const decoCodeInput = normalizeDeco(view.decorationCode);
    // Resolve which metadata code this matches
    const targetCode = decoCodeInput === threeDDecoCode ? threeDDecoCode : flatDecoCode;
    const decoProd = resolveDecoProduct(targetCode);
    
    if (decoProd) {
      const decoPbe = MOCK_PRICEBOOK_ENTRIES.find(e => 
        e.Product2Id === decoProd.Id && 
        e.Pricebook2Id === authPricebookId && 
        e.IsActive
      );
      if (decoPbe) {
        additionalLocationTotal += decoPbe.UnitPrice;
        logs.push(`Location ${view.viewCode} uses ${view.decorationCode}. Matched to Metadata Code ${targetCode} (Prod ID: ${decoProd.Id}). Adding PBE Price: $${decoPbe.UnitPrice.toFixed(2)}`);
      } else {
        logs.push(`No PBE found for decoration product ${decoProd.ProductCode} in Auth Price Book.`);
      }
    } else {
      logs.push(`Could not resolve decoration product for code: ${view.decorationCode}`);
    }
  });

  const computedUnitPrice = Number((baseUnitPrice + decorationOverride + additionalLocationTotal).toFixed(2));
  const fingerprint = btoa(`${sku}|${q}|${computedUnitPrice}`).substring(0, 16);

  return {
    product2Id: mainProduct.Id,
    pricebookEntryId: basePbe.Id,
    baseUnitPrice,
    decorationOverride,
    additionalLocationTotal,
    computedUnitPrice,
    quantity: q,
    pricingFingerprint: fingerprint,
    logs
  };
};

export const runCartOrchestrator = (cartItems: CartItem[]): CartItem[] => {
  return cartItems.map(item => {
    if (item.ComputedUnitPrice__c) {
      return {
        ...item,
        UnitPrice: item.ComputedUnitPrice__c,
        TotalLineAmount: item.ComputedUnitPrice__c * item.Quantity
      };
    }
    return item;
  });
};
