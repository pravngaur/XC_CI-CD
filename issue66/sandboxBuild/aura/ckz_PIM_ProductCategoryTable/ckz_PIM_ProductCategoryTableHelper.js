({
    createNewProductCategoryEntries: function(component, total) {
        console.log('inside createNewProductCategoryEntries');

        var productCategoryEntries = [];

        for(var i = 0; i < total; i++) {
            var productCategoryEntry = this.createNewProductCategoryEntry(component);
            productCategoryEntries.push(productCategoryEntry);
        }
        return productCategoryEntries;
    },
    createNewProductCategoryEntry: function(component) {
        var productCategoryEntry = {};

        productCategoryEntry.categoryId = null;
        productCategoryEntry.categoryName = null;

        productCategoryEntry.startDate = null;
        productCategoryEntry.endDate = null;

        productCategoryEntry.sequence = null;

        productCategoryEntry.sfid = null;
        productCategoryEntry.remove = false;

        return productCategoryEntry;
    },
    saveAttributes: function(component) {
         var productDataMap = component.get("v.productDataMap");
         var productCategoryEntries = component.get("v.productCategoryEntries");

         productDataMap.productCategoryEntries = productCategoryEntries;

         component.set("v.productDataMap", productDataMap);
     },
     getStorefrontOptions: function(component) {
        var productDataMap = component.get("v.productDataMap");
        var productDetails = productDataMap.productDetails;

        component.set("v.storefrontOptions", productDetails.selectedStorefronts);
     },
     getTree: function(component) {
        console.log('inside getTree');

        var action = component.get("c.getCategoryTree");

        action.setCallback(this, function (response) {
            var state = response.getState();
            if (state === 'SUCCESS') {
                var returnValue = response.getReturnValue();

                var json = JSON.parse(returnValue);

                component.set('v.allCategoryItems', json);

                console.log('all category trees retrieved');
                
                if(json.length == 1) {
                    var tempCategoryTree = json[0];
                    component.set("v.storefrontCategoryTree", tempCategoryTree.items);

                }
                
            }
            else {
                console.log('Failed with state: ' + state);
            }
        });

        $A.enqueueAction(action);
    },
})