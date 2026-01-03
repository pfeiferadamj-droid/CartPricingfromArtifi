public with sharing class EstimatorPricingService {

    public class PricingResult {
        @AuraEnabled public String mainProductId;
        @AuraEnabled public Decimal unitPrice;
        @AuraEnabled public String fingerprint;
    }

    // Inner classes to map the JSON structure
    public class DecorationPayload {
        public List<DesignView> designData;
    }

    public class DesignView {
        public String viewCode;      // e.g., 'FRONT', 'BACK'
        public String decorationCode; // e.g., '3DEMBROIDERY'
        public List<Object> image;    // If not empty, decoration is applied
    }

    @AuraEnabled
    public static PricingResult calculateUnitPrice(String jsonPayload, String garmentSku) {
        // 1. Parse JSON Payload
        DecorationPayload payload = (DecorationPayload) JSON.deserialize(jsonPayload, DecorationPayload.class);

        // 2. Fetch Configuration from Custom Metadata
        B2B_Store_Defaults__mdt config = [
            SELECT Authenticated_Price_Book_ID__c, 
                   Flat_Embroidery_Product_Code__c, 
                   ThreeD_Embroidery_Product_Code__c 
            FROM B2B_Store_Defaults__mdt 
            WHERE DeveloperName = 'Shop_Defaults' 
            LIMIT 1
        ];

        String pricebookId = config.Authenticated_Price_Book_ID__c;
        String flatCode = normalize(config.Flat_Embroidery_Product_Code__c);
        String threeDCode = normalize(config.ThreeD_Embroidery_Product_Code__c);

        // 3. Resolve Main Product (Garment) & Base Price
        Product2 mainProduct = [SELECT Id FROM Product2 WHERE ProductCode = :garmentSku LIMIT 1];
        
        PricebookEntry basePbe = [
            SELECT UnitPrice 
            FROM PricebookEntry 
            WHERE Product2Id = :mainProduct.Id 
            AND Pricebook2Id = :pricebookId 
            AND IsActive = true 
            LIMIT 1
        ];

        Decimal finalPrice = basePbe.UnitPrice;

        // 4. Process Front View (Logic: Check for 3D Override Rule)
        DesignView frontView = null;
        for (DesignView view : payload.designData) {
            if (view.viewCode == 'FRONT') {
                frontView = view;
                break;
            }
        }

        if (frontView != null && normalize(frontView.decorationCode) == threeDCode) {
            // Get the ID of the 3D Decoration Product defined in metadata
            Product2 decoProduct = [SELECT Id FROM Product2 WHERE ProductCode = :config.ThreeD_Embroidery_Product_Code__c LIMIT 1];

            // Look for a specific override rule linking this Garment to this Decoration
            List<Product_Estimator_Decoration__c> rules = [
                SELECT Override_Price__c 
                FROM Product_Estimator_Decoration__c 
                WHERE Product__c = :mainProduct.Id 
                AND Decoration__c = :decoProduct.Id
                AND IsActive__c = true
                LIMIT 1
            ];

            if (!rules.isEmpty()) {
                finalPrice += rules[0].Override_Price__c;
            }
        }

        // 5. Process Additional Locations (Logic: Add UnitPrice from Price Book)
        // Gather codes needed for lookup
        Set<String> neededDecoCodes = new Set<String>();
        neededDecoCodes.add(config.Flat_Embroidery_Product_Code__c);
        neededDecoCodes.add(config.ThreeD_Embroidery_Product_Code__c);

        // Pre-fetch Price Book Entries for decoration types
        List<PricebookEntry> decoPbes = [
            SELECT Product2.ProductCode, UnitPrice 
            FROM PricebookEntry 
            WHERE Pricebook2Id = :pricebookId 
            AND Product2.ProductCode IN :neededDecoCodes
            AND IsActive = true
        ];

        Map<String, Decimal> codeToPriceMap = new Map<String, Decimal>();
        for (PricebookEntry pbe : decoPbes) {
            codeToPriceMap.put(normalize(pbe.Product2.ProductCode), pbe.UnitPrice);
        }

        // Iterate non-front views
        for (DesignView view : payload.designData) {
            if (view.viewCode == 'FRONT') continue;

            // If view has an image, applying pricing
            if (view.image != null && !view.image.isEmpty()) {
                String inputCode = normalize(view.decorationCode);
                String targetCode = (inputCode == threeDCode) ? threeDCode : flatCode;

                if (codeToPriceMap.containsKey(targetCode)) {
                    finalPrice += codeToPriceMap.get(targetCode);
                }
            }
        }

        // 6. Return Result
        PricingResult result = new PricingResult();
        result.mainProductId = mainProduct.Id;
        result.unitPrice = finalPrice;
        // Simple hash to verify price integrity later if needed
        result.fingerprint = EncodingUtil.base64Encode(Blob.valueOf(garmentSku + '|' + finalPrice));
        
        return result;
    }

    private static String normalize(String input) {
        return (input == null) ? '' : input.deleteWhitespace().toUpperCase();
    }
}
