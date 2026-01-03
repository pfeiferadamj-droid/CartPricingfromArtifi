
import { Product2, PricebookEntry, Product_Estimator_Decoration__c, B2B_Store_Defaults__mdt } from './types';

export const SHOP_DEFAULTS: B2B_Store_Defaults__mdt = {
  DeveloperName: 'Shop_Defaults',
  Authenticated_Price_Book_ID__c: 'pb_auth_001',
  Flat_Embroidery_Product_Code__c: 'FLATEMBROIDERY',
  ThreeD_Embroidery_Product_Code__c: '3DEMBROIDERY'
};

export const MOCK_PRODUCTS: Product2[] = [
  // Main item (Garment)
  { Id: 'p_main', Name: 'Premium Performance Polo', ProductCode: 'TMX-1400CT-020-Grey' },
  
  // Decoration Products (The target of the Decoration__c lookup)
  { Id: 'p_deco_flat_id', Name: 'Flat Embroidery', ProductCode: 'FLATEMBROIDERY' },
  { Id: 'p_deco_3d_id', Name: '3D Embroidery', ProductCode: '3DEMBROIDERY' }
];

export const MOCK_PRICEBOOK_ENTRIES: PricebookEntry[] = [
  // Base Price for Main Garment
  { Id: 'pbe_main', Product2Id: 'p_main', UnitPrice: 22.00, IsActive: true, CurrencyIsoCode: 'USD', Pricebook2Id: 'pb_auth_001' },
  
  // Prices for decoration products used in additional locations
  { Id: 'pbe_deco_flat', Product2Id: 'p_deco_flat_id', UnitPrice: 5.00, IsActive: true, CurrencyIsoCode: 'USD', Pricebook2Id: 'pb_auth_001' },
  { Id: 'pbe_deco_3d', Product2Id: 'p_deco_3d_id', UnitPrice: 9.50, IsActive: true, CurrencyIsoCode: 'USD', Pricebook2Id: 'pb_auth_001' }
];

export const MOCK_DECORATION_RULES: Product_Estimator_Decoration__c[] = [
  {
    Id: 'deco_3d_rule',
    Product__c: 'p_main',
    Decoration__c: 'p_deco_3d_id', // Lookup to the 3D Embroidery Product record
    Override_Price__c: 4.50,
    IsActive__c: true
  }
];
