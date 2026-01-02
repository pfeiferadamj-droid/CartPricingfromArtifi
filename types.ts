
export interface Product2 {
  Id: string;
  Name: string;
  ProductCode: string;
}

export interface PricebookEntry {
  Id: string;
  Product2Id: string;
  UnitPrice: number;
  IsActive: boolean;
  CurrencyIsoCode: string;
}

export interface ProductEstimatorDecoration {
  Id: string;
  Product__c: string;
  DecorationCode__c: string;
  ViewCode__c: string;
  MinQty__c: number | null;
  MaxQty__c: number | null;
  PerUnitAddOn__c: number;
  PerColorAddOn__c?: number;
  PerStitchAddOn__c?: number;
  SetupFee__c?: number;
  IsActive__c: boolean;
  StartDate__c?: string;
  EndDate__c?: string;
}

export interface DesignImage {
  src: string;
  stitchCount: number;
  numberOfColors: number;
}

export interface DesignView {
  viewName: string;
  viewCode: string;
  image: DesignImage[];
  text: any[];
  decorationCode: string;
}

export interface DecorationPayload {
  sku: string;
  designId: number;
  designData: DesignView[];
}

export interface PricingResult {
  product2Id: string;
  pricebookEntryId: string;
  baseUnitPrice: number;
  perUnitDecorationTotal: number;
  allocatedSetupPerUnit: number;
  computedUnitPrice: number;
  quantity: number;
  pricingFingerprint: string;
}

export interface CartItem {
  Id: string;
  Product2Id: string;
  Quantity: number;
  UnitPrice: number; // Native
  ComputedUnitPrice__c: number; // Custom
  DecorationUnitAdj__c: number; // Custom
  AllocatedSetupPerUnit__c: number; // Custom
  PricingFingerprint__c: string; // Custom
  TotalLineAmount: number;
}
