({
    doInit: function(component, event, helper) {
        console.log('ckz_OrderFormDataEntry - begin init()');

        helper.waiting(component);

        var contactId = component.get('v.contactId');
        var orderType = component.get('v.orderType');
        var userId = component.get('v.userId');
        var selectedOrder = component.get('v.selectedOrder');
        var selectedOrderId = component.get('v.selectedOrderId');
        var locale = component.get('v.locale');
        var selectedStorefront = component.get('v.selectedStorefront');
        var currencyCode = component.get('v.currencyCode');
        var cartId = component.get('v.cartId');
        var cartEncryptedId = component.get('v.cartEncryptedId');
        var accountId = component.get('v.accountId');
        var cartStatus = component.get('v.cartStatus');
        var selectedObjectName = component.get('v.selectedObjectName');
        var orderItems = component.get('v.orderItems');

        console.log('contactId = ' + contactId);
        console.log('userId = ' + userId);
        console.log('locale = ' + locale);
        console.log('selectedStorefront = ' + selectedStorefront);
        console.log('orderType = ' + orderType);
        console.log('selectedOrder = ' + selectedOrder);
        console.log('selectedOrderId = ' + selectedOrderId);
        console.log('cartId = ' + cartId);
        console.log('cartEncryptedId = ' + cartEncryptedId);
        console.log('accountId = ' + accountId);
        console.log('cartStatus = ' + cartStatus);
        console.log('selectedObjectName = ' + selectedObjectName);
        console.log('orderItems = ' + JSON.stringify(orderItems));

        // Attempt to clear out variables when [Previous] is used in the flow
        if(orderType == 'order') {
            component.set('v.cartId', null);
            component.set('v.cartEncryptedId', null);
        }
        else if(orderType == 'cart') {
            component.set('v.selectedOrder', null);
            component.set('v.selectedOrderId', null);
        }
        else {
            component.set('v.cartId', '');
            component.set('v.cartEncryptedId', '');
            component.set('v.selectedOrder', null);
            component.set('v.selectedOrderId', null);
        }

        if(orderType == 'new') {

            //var orderItems = [];

            // 2019-06-07  msobczak: removed auto generation of cart lines
            /*
            var maxItems = 10;

            var orderItems = [];

            for(var i = 0; i < maxItems; i++) {
                var orderItem = helper.createNewOrderItem();

                orderItems.push(orderItem);
            }
            */

            if(!orderItems || orderItems == null ) {
                component.set('v.orderItems', []);
            }

            // 2019-06-04  msobczak: added
            helper.doneWaiting(component);
        }
        else if(orderType == 'order') {

            var newItemFound = helper.hasNewItem(component);
            if(newItemFound) {
                // TODO issue on what to do here, if the cart has not yet been created.
                // Should we automatically create it?  Or require the user to push the button?
                if(cartId == null) {
                    helper.createCart(component);
                }
                else {
                    helper.updateCartHelper(component, helper);
                }
            }
            else {
                helper.getOrderItems(component, userId, selectedStorefront, currencyCode, accountId, locale, selectedOrderId);
            }
        }
        else if(orderType == 'cart') {
            var newItemFound = helper.hasNewItem(component);

            if(newItemFound) {
                helper.updateCartHelper(component, helper);
            }
            else {
                helper.getCartItems(component, userId, selectedStorefront, currencyCode, accountId, locale, cartId);
            }
        }
        else {
            
        }

        console.log('ckz_OrderFormDataEntry - exit init()');

    },
    reloadCart: function(component, event, helper) {
        var userId = component.get('v.userId');
        var selectedStorefront = component.get('v.selectedStorefront');
        var locale = component.get('v.locale');
        var cartId = component.get('v.cartId');
        var accountId = component.get('v.accountId');
        var currencyCode = component.get('v.currencyCode');

        helper.getCartItems(component, userId, selectedStorefront, currencyCode, accountId, locale, cartId);
    },
    clearMessages: function(component, event, helper) {
        component.set("v.pageMessages", []);
    },
    handleAddMoreOrderItems: function(component, event, helper) {

        console.log('inside handleAddMoreOrderItems');

        var maxItems = 5;

        var orderItems = component.get("v.orderItems");

        console.log('orderItems size = ' + orderItems.length);

        for(var i = 0; i < maxItems; i++) {
            var orderItem = helper.createNewOrderItem();

            orderItems.push(orderItem);
        }

        console.log('orderItems new size = ' + orderItems.length);

        component.set('v.orderItems', orderItems);

    },
    // Called by the event handler
    handleUpdateRemoveItems: function(component, event, helper) {

        console.log('inside handleUpdateRemovedItems');

        var sku = event.getParam("sku");
        var cart_item_sfid = event.getParam("cart_item_sfid");
        var isChecked = event.getParam("checked");

        var removeItems = component.get("v.removeItems");

        if(isChecked && (cart_item_sfid in removeItems) == false) {
            removeItems[cart_item_sfid] = sku;
        }
        else {
            delete removeItems[cart_item_sfid];
        }

        console.log('removeItems = ' + JSON.stringify(removeItems));

        component.set("v.removeItems", removeItems);

    },
    // Called by the event handler
    handleUpdateChangeItems: function(component, event, helper) {

        console.log('inside handleUpdateChangeItems');

        var sku = event.getParam("sku");
        var cart_item_sfid = event.getParam("cart_item_sfid");
        var qty = event.getParam("qty");
        var orig_qty = event.getParam("orig_qty");

        var changeItems = component.get("v.changeItems");

        if(qty != orig_qty) {
            changeItems[cart_item_sfid] = { "cart_item_sfid" : cart_item_sfid, "qty" : qty, "sku" : sku };
        }
        else {
            if(cart_item_sfid in changeItems) {
                delete changeItems[cart_item_sfid];
            }
        }

        console.log('changeItems = ' + JSON.stringify(changeItems));

        component.set("v.changeItems", changeItems);

    },
    createCart: function(component, event, helper) {

        console.log('inside controller.createCart()');

        helper.createCart(component);
        
    },
    /*
        Used to add, update or remove items from an existing cart.
        1. Add items to cart
        2. Update items in the cart (qty chg)
        3. Remove items from the cart
     */
    updateCart: function(component, event, helper) {

        helper.updateCartHelper(component, helper);
    },
    handleTypeaheadButtonClick: function(component, event, helper) {
        var isTypeaheadEnabled = component.get("v.isTypeaheadEnabled");

        var source = event.getSource();

        var messages = [];

        if(isTypeaheadEnabled) {
            component.set("v.isTypeaheadEnabled", false);
            messages.push({'severity' : 'confirm', 'message' : 'Typeahead disabled'});
        }
        else {
            component.set("v.isTypeaheadEnabled", true);
            messages.push({'severity' : 'confirm', 'message' : 'Typeahead enabled'});
        }

        component.set("v.pageMessages", messages);

    },
    handleNavigateNext: function(component, event, helper) {

        var isValid = false;

        var messages = [];

        component.set("v.pageMessages", messages);

        var removeItems = component.get("v.removeItems");

        var changeItems = component.get("v.changeItems");

        var cartId = component.get("v.cartId");

        if(Object.keys(removeItems).length > 0) {
            messages.push({'severity' : 'error', 'message' : "Please click [Update Cart] to commit the items you have selected to remove" });
        }

        if(Object.keys(changeItems).length > 0) {
            messages.push({'severity' : 'error', 'message' : "Please click [Update Cart] to commit the item quantity changes" });
        }

        var orderItems = component.get("v.orderItems");

        for(var i = 0; i < orderItems.length; i++) {
            if(orderItems[i].sku != null && orderItems[i].sku != "") {
                if(orderItems[i].cart_item_sfid == null) {
                    if(cartId == null || cartId == '') {
                        messages.push({'severity' : 'error', 'message' : "Please click [Create Cart] to commit the item: " + orderItems[i].sku });
                    }
                    else {
                       messages.push({'severity' : 'error', 'message' : "Please click [Update Cart] to commit the item: " + orderItems[i].sku });
                    }
                }
            }
        }

        if(messages.length == 0) {
            isValid = true;
        }
        else {
            component.set("v.pageMessages", messages);
        }

        if(isValid) {

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

            event.setParam("type", "c:ckz_QuickCheckout");
            event.setParam("attributes", attrs);

            event.fire();

        }

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

        event.setParam("type", "c:ckz_OrderFormStart");
        event.setParam("attributes", attrs);

        event.fire();

    },
    /* This is for mobile */
    handleAddItem: function(component, event, helper) {

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

        event.setParam("type", "c:ckz_OrderForm_AddItem");
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