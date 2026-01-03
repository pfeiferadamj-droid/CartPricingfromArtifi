/**
 * @description Commerce Cart Extension to enforce custom decoration pricing.
 * Registered for Extension Point: Commerce_Domain_Cart_Calculate
 */
global class CartDecorationsOrchestrator extends CartExtension.CartCalculate {
    
    /**
     * @description Iterates over items. If ComputedUnitPrice__c is set, it becomes the definitive Unit Price.
     */
    global override void calculate(CartExtension.CartCalculateInputContext context) {
        CartExtension.Cart cart = context.getCart();
        CartExtension.CartItemList cartItems = cart.getCartItems();

        if (cartItems.isEmpty()) {
            return;
        }

        for (Integer i = 0; i < cartItems.size(); i++) {
            CartExtension.CartItem cartItem = cartItems.get(i);
            
            // Retrieve the custom field value populated by the LWC
            Decimal computedPrice = (Decimal) cartItem.getCustomField('ComputedUnitPrice__c');

            // Apply logic only if computed price is present and greater than zero
            if (computedPrice != null && computedPrice > 0) {
                // Force the Unit Price to match our calculation
                cartItem.setSalesPrice(computedPrice);
                cartItem.setListPrice(computedPrice);
                cartItem.setUnitPrice(computedPrice);
                
                // Recalculate totals
                cartItem.setTotalLineAmount(computedPrice * cartItem.getQuantity());
                cartItem.setTotalListPrice(computedPrice * cartItem.getQuantity());
                cartItem.setTotalPrice(computedPrice * cartItem.getQuantity());
                
                // Zero out adjustments to prevent conflict
                cartItem.setAdjustmentAmount(0);
                cartItem.setTotalAdjustmentAmount(0);
            }
        }
    }
}
