({
    doInit: function(component, event, helper) {
        console.log('ckz_OrderForm_AddItem - begin init()');

        var orderItem = helper.createNewOrderItem();

        component.set("v.orderItem", orderItem);
    },
    getProductSuggestions: function(component, event, helper) {
        console.log('inside getProductSuggestions');

        var enableTypeahead = component.get("v.enableTypeahead");

        if(enableTypeahead == false) {
            return;
        }

        // clear out previous matches
        component.set("v.productMatches", []);

        var storefront = component.get('v.storefront');
        var locale = component.get('v.locale');
        var searchString = component.get('v.searchString');
        var accountId = component.get("v.accountId");
        var currencyCode = component.get("v.currencyCode");
        var userId = component.get("v.userId");

        if(searchString.length < 3) {
            return false;
        }

        var action = component.get("c.fetchProductSuggestions");

        action.setParams({
            "userId" : userId,
            "accountId" : accountId,
            "currencyCode" : currencyCode,
            "storefront" : storefront,
            "locale" : locale,
            "searchString" : searchString
        });

        helper.waiting(component);

        action.setCallback(this, function (response) {
            var state = response.getState();
            console.log('state = ' + state);
            if (state === 'SUCCESS') {
                var returnValue = response.getReturnValue();

                var matches = [];

                for(var i = 0; i < returnValue.length; i++) {
                    var product = {};

                    product.productName = returnValue[i].productName;
                    product.sfid = returnValue[i].sfid;
                    product.price = returnValue[i].price;
                    product.sku = returnValue[i].sku;

                    matches.push(product);
                }

                component.set("v.productMatches", matches);

                console.log('returnValue = ' + returnValue);

            }
            else {
                console.log('Failed with state: ' + state);
            }

            helper.doneWaiting(component);
        });

        $A.enqueueAction(action);
    },
    // Called when the user selects a product suggestion
    setProductFields: function(component, event, helper) {
        console.log('inside setProductFields');

        var selectedItem = event.currentTarget;
        var productName = selectedItem.dataset.productname;
        var sku = selectedItem.dataset.sku;
        var price = parseFloat(selectedItem.dataset.price);
        var product_sfid = selectedItem.dataset.product_sfid;

        component.set('v.productName', productName);
        component.set('v.sku', sku);
        component.set('v.price', price);
        component.set('v.product_sfid', product_sfid);
        component.set("v.qty", 1);

        component.set("v.productMatches", []);

    },
    clearProductFields: function(component, event, helper) {
        console.log('inside clearProductFields');

        component.set('v.productName', '');
        component.set('v.sku', '');
        component.set('v.price', null);
        component.set('v.product_sfid', null);
        component.set('v.cart_item_sfid', null);
        component.set('v.qty', null);
        component.set('v.orig_qty', null);

        component.set('v.searchString', '');
    },
    handleNavigatePrev: function(component, event, helper) {

        var attrs = {};

        attrs.contactId = component.get("v.contactId");
        attrs.userId = component.get("v.userId");
        attrs.accountId = component.get("v.accountId");
        attrs.locale = component.get("v.locale");
        attrs.selectedStorefront = component.get("v.selectedStorefront");
        attrs.selectedOrder = component.get("v.selectedOrder");
        attrs.selectedOrderId = component.get("v.selectedOrderId");
        attrs.cartId = component.get("v.cartId");
        attrs.cartEncryptedId = component.get("v.cartEncryptedId");
        attrs.orderType = component.get("v.orderType");
        attrs.currencyCode = component.get("v.currencyCode");
        attrs.selectedObjectName = component.get("v.selectedObjectName");

        attrs.recordId = component.get('v.recordId');
        attrs.userName = component.get('v.userName');
        attrs.accountGroupName = component.get('v.accountGroupName');
        attrs.accountName = component.get('v.accountName');

        var event = component.getEvent("renderPanel");

        event.setParam("type", "c:ckz_OrderFormDataEntry");
        event.setParam("attributes", attrs);

        event.fire();

    },
    addItemAndReturnToCart: function(component, event, helper) {

        console.log('ckz_OrderForm_AddItem - begin addItemAndReturnToCart()');

        var orderItem = {};
        orderItem.sku = component.get("v.sku");
        orderItem.productName = component.get("v.productName");
        orderItem.price = component.get("v.price");
        orderItem.product_sfid = component.get("v.product_sfid");
        //orderItem.cart_item_sfid = component.get("v.cart_item_sfid");

        var qty = component.get("v.qty");
        orderItem.qty = parseInt(qty);

        orderItem.orig_qty = parseInt(component.get("v.orig_qty"));
        orderItem.cart_item_sfid = '';

        var orderItems = component.get("v.orderItems");

        orderItems.push(orderItem);

        var attrs = {};

        attrs.contactId = component.get("v.contactId");
        attrs.userId = component.get("v.userId");
        attrs.accountId = component.get("v.accountId");
        attrs.locale = component.get("v.locale");
        attrs.selectedStorefront = component.get("v.selectedStorefront");
        attrs.selectedOrder = component.get("v.selectedOrder");
        attrs.selectedOrderId = component.get("v.selectedOrderId");
        attrs.cartId = component.get("v.cartId");
        attrs.cartEncryptedId = component.get("v.cartEncryptedId");
        attrs.orderType = component.get("v.orderType");
        attrs.currencyCode = component.get("v.currencyCode");
        attrs.selectedObjectName = component.get("v.selectedObjectName");

        attrs.recordId = component.get('v.recordId');
        attrs.userName = component.get('v.userName');
        attrs.accountGroupName = component.get('v.accountGroupName');
        attrs.accountName = component.get('v.accountName');

        attrs.orderItems = component.get('v.orderItems');

        var event = component.getEvent("renderPanel");

        event.setParam("type", "c:ckz_OrderFormDataEntry");
        event.setParam("attributes", attrs);

        event.fire();
    },
    waiting: function(component, event, helper) {
        helper.waiting(component);
    },
    doneWaiting: function(component, event, helper) {
        helper.doneWaiting(component);
    },
    
})