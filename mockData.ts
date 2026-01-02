
import { Product2, PricebookEntry, ProductEstimatorDecoration } from './types';

export const MOCK_PRODUCTS: Product2[] = [
  { Id: 'p001', Name: 'Performance Polo - Grey', ProductCode: 'TMX-1400CT-020-Grey' },
  { Id: 'p002', Name: 'Classic Cap - Navy', ProductCode: 'CAP-100-NV' }
];

export const MOCK_PRICEBOOK_ENTRIES: PricebookEntry[] = [
  { Id: 'pbe001', Product2Id: 'p001', UnitPrice: 25.00, IsActive: true, CurrencyIsoCode: 'USD' },
  { Id: 'pbe002', Product2Id: 'p002', UnitPrice: 12.50, IsActive: true, CurrencyIsoCode: 'USD' }
];

export const MOCK_DECORATION_RULES: ProductEstimatorDecoration[] = [
  {
    Id: 'rule001',
    Product__c: 'p001',
    DecorationCode__c: '3DEmbroidery',
    ViewCode__c: 'FRONT',
    MinQty__c: 1,
    MaxQty__c: 49,
    PerUnitAddOn__c: 5.50,
    PerColorAddOn__c: 0.50,
    PerStitchAddOn__c: 0.0001, // per stitch
    SetupFee__c: 50.00,
    IsActive__c: true
  },
  {
    Id: 'rule002',
    Product__c: 'p001',
    DecorationCode__c: '3DEmbroidery',
    ViewCode__c: 'FRONT',
    MinQty__c: 50,
    MaxQty__c: 9999,
    PerUnitAddOn__c: 4.25, // Tiered discount
    PerColorAddOn__c: 0.35,
    PerStitchAddOn__c: 0.00008,
    SetupFee__c: 25.00,
    IsActive__c: true
  },
  {
    Id: 'rule003',
    Product__c: 'p001',
    DecorationCode__c: 'FlatEmbroidery',
    ViewCode__c: 'BACK',
    MinQty__c: 1,
    MaxQty__c: 9999,
    PerUnitAddOn__c: 3.00,
    SetupFee__c: 15.00,
    IsActive__c: true
  }
];
