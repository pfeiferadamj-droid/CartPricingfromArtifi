
# Integration & Setup Guide

This guide details the steps required to deploy the Decorations Pricing logic into a Salesforce Commerce environment.

## 1. Custom Schema Requirements

### Custom Object: `Product_Estimator_Decoration__c`
Defines price overrides for specific decoration types on a per-garment basis.
- **Product__c**: Lookup(Product2) - The garment/item SKU.
- **Decoration__c**: Lookup(Product2) - **IMPORTANT**: This points to a Product record whose `ProductCode` matches the JSON `decorationCode` (e.g., "3DEMBROIDERY").
- **Override_Price__c**: Currency (16, 2)
- **IsActive__c**: Checkbox

### Custom Metadata: `B2B_Store_Defaults__mdt`
Used to store store-wide configuration settings and environment-specific product codes.
- **Label**: Shop_Defaults
- **Authenticated_Price_Book_ID__c**: Text (Stores the ID of the active Price Book).
- **Flat_Embroidery_Product_Code__c**: Text (The ProductCode for Flat Embroidery in the current environment).
- **ThreeD_Embroidery_Product_Code__c**: Text (The ProductCode for 3D Embroidery in the current environment).

### Custom Fields on `CartItem`
- **ComputedUnitPrice__c**: Currency (16, 2)
- **PricingFingerprint__c**: Text (64)

---

## 2. Product Setup

To ensure the logic works correctly, your Product Catalog must contain:
1.  **Garment Products**: The main items being sold (e.g., "Performance Polo").
2.  **Decoration Products**: Standalone product records representing the decoration types.
    *   The `ProductCode` should match the values entered in your `B2B_Store_Defaults__mdt` record.
    *   These products must be added to the **Auth Price Book** with their per-location unit price.

---

## 3. Apex Logic Implementation

### Step-by-Step Resolution
When the LWC calls the Apex Service:
1.  **Get Configuration**: Query `B2B_Store_Defaults__mdt` for the PB ID and the configurable decoration `ProductCodes`.
2.  **Get Decoration Product**: For any decoration code in JSON, query `Product2` where `ProductCode` matches the code from metadata.
3.  **Front Logic**:
    - If incoming code matches the configured 3D code, find the `Product_Estimator_Decoration__c` record where `Product__c` is the garment ID and `Decoration__c` is the 3D Product ID.
    - Add `Override_Price__c` to base unit price.
4.  **Additional Locations**:
    - For each non-front view with an image, find the decoration's `PricebookEntry` for the PB ID.
    - Add its `UnitPrice` to the total.

---

## 4. Orchestrator Configuration

The Cart Orchestrator is a Commerce Extension that ensures the platform's pricing engine respects the custom decoration costs.

### A. Create the Apex Extension Class
```apex
global class CartDecorationsOrchestrator extends CartExtension.CartCalculate {
    override global void calculate(CartExtension.CartCalculateInputContext context) {
        for (CartExtension.CartItemWrapper itemWrapper : context.getCartItems()) {
            CartExtension.CartItem cartItem = itemWrapper.getCartItem();
            Decimal computedPrice = (Decimal)cartItem.getCustomField('ComputedUnitPrice__c');

            if (computedPrice != null && computedPrice > 0) {
                cartItem.setListPrice(computedPrice);
                cartItem.setUnitPrice(computedPrice);
                cartItem.setAdjustmentAmount(0);
            }
        }
    }
}
```

### B. Registration & Mapping
1.  Register the class under **Setup** -> **Extension Points** for `Commerce_Domain_Cart_Calculate`.
2.  Map the extension to your store via **Commerce App** -> **Administration** -> **Extensions**.

---

## 5. Verification
- Use the **System Metadata** pane in the simulator to verify your environment configuration.
- Verify that `Decoration__c` lookups are resolving to the correct IDs based on the metadata ProductCodes.
