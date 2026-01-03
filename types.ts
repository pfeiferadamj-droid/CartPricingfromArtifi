
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
  Pricebook2Id: string;
}

export interface B2B_Store_Defaults__mdt {
  DeveloperName: string;
  Authenticated_Price_Book_ID__c: string;
  Flat_Embroidery_Product_Code__c: string;
  ThreeD_Embroidery_Product_Code__c: string;
}

export interface Product_Estimator_Decoration__c {
  Id: string;
  Product__c: string; // Lookup to Product2 (The garment)
  Decoration__c: string; // Lookup to Product2 (The decoration type product)
  Override_Price__c: number;
  IsActive__c: boolean;
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
  decorationOverride: number;
  additionalLocationTotal: number;
  computedUnitPrice: number;
  quantity: number;
  pricingFingerprint: string;
  logs: string[];
}

export interface CartItem {
  Id: string;
  Product2Id: string;
  Quantity: number;
  UnitPrice: number; 
  ComputedUnitPrice__c: number;
  PricingFingerprint__c: string;
  TotalLineAmount: number;
}
