
import { LightningElement, api } from 'lwc';
import { addItemToCart, calculateCart } from 'lightning/commerceCartApi';
import calculateUnitPrice from '@salesforce/apex/EstimatorPricingService.calculateUnitPrice';

export default class DecorationsAddToCart extends LightningElement {
    @api webstoreId;
    @api effectiveAccountId;

    /**
     * Public API to be called by the design tool/parent component.
     * @param {Object} designPayload - The JSON design data.
     * @param {String} sku - Product SKU.
     * @param {Number} quantity - Quantity to add.
     */
    @api
    async processAddToCart(designPayload, sku, quantity = 1) {
        try {
            // 1. Get Computed Price from Apex
            const pricing = await calculateUnitPrice({
                jsonPayload: JSON.stringify(designPayload),
                garmentSku: sku
            });

            // 2. Add to Cart with custom fields
            // The Orchestrator will pick up ComputedUnitPrice__c on the next calculation
            await addItemToCart(this.webstoreId, pricing.mainProductId, quantity, {
                customFields: {
                    'ComputedUnitPrice__c': pricing.unitPrice,
                    'PricingFingerprint__c': pricing.fingerprint
                }
            });

            // 3. Force Recalculation
            // This ensures the Orchestrator runs immediately and the UI updates with the correct price
            await calculateCart(this.webstoreId);

            this.dispatchEvent(new CustomEvent('success', {
                detail: { message: 'Item added with custom decoration pricing.' }
            }));

        } catch (error) {
            console.error('Decorations Pricing Error:', error);
            this.dispatchEvent(new CustomEvent('error', {
                detail: { message: error.body?.message || 'Error calculating decoration price.' }
            }));
        }
    }
}
