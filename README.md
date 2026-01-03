
# LWC: Decorations Pricing on Add to Cart

A high-performance, headless Lightning Web Component designed to calculate dynamic decoration pricing for B2B/D2C Commerce.

## 🚀 Overview
The component intercepts the **Add to Cart** action, processes a JSON payload from the design tool, and computes a final unit price based on organizational business rules. It operates "invisibly" (headless) and relies on a server-side Orchestrator to ensure pricing consistency.

## 🛠 Business Logic
The pricing engine follows these strict steps:

1.  **Metadata Lookup**: Retrieves `Authenticated_Price_Book_ID__c` from the `Shop_Defaults` record in the `B2B_Store_Defaults__mdt` custom metadata object.
2.  **Base Price**: Resolves the `PricebookEntry` for the product SKU (main item) using the Auth Price Book ID.
3.  **Front Decoration (3D Override)**: 
    *   Inspects the `designData` for a `viewCode` of `FRONT`.
    *   If `decorationCode` is `3DEMBROIDERY`, it queries `Product_Estimator_Decoration__c` for an `Override_Price__c`.
    *   This override is added to the base unit price.
4.  **Additional Locations**:
    *   Identifies other views (BACK, LEFT, RIGHT) containing an image.
    *   Queries the Auth Price Book for the unit price of the corresponding decoration product (e.g., "Flat Embroidery Decoration").
    *   Adds this price to the item total.

## ⚙️ Integration Summary
Integrating this into a Salesforce Commerce environment involves:
1.  **Schema Setup**: Creating the `Product_Estimator_Decoration__c` custom object and `CartItem` custom fields.
2.  **Metadata**: Configuring the `B2B_Store_Defaults__mdt` record.
3.  **Apex**: Deploying the Pricing Service and the Cart Orchestrator Extension.
4.  **LWC**: Placing the headless component on the Product Detail Page (PDP).

**[See INTEGRATION_GUIDE.md for step-by-step instructions](./INTEGRATION_GUIDE.md)**

## 🛡️ Cart Consistency
To prevent the platform from reverting prices, the solution uses a **Cart Orchestrator** (Commerce Extension) that intercepts cart calculations and applies the `ComputedUnitPrice__c` stored on the line item.
