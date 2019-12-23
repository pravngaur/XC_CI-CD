/**
 * Created by msobczak on 10/30/2018.
 *
 */
({
    doInit: function(component, event, helper) {

        console.log('ckz_OrderFormStart - begin init()');

        var contactId = component.get('v.contactId');
        console.log('contactId = ' + contactId);

        var userId = component.get('v.userId');
        console.log('userId = ' + userId);

        var cartId = component.get('v.cartId');
        console.log('cartId = ' + cartId);

        var cartEncryptedId = component.get('v.cartEncryptedId');
        console.log('cartEncryptedId = ' + cartEncryptedId);

        var selectedStorefront = component.get('v.selectedStorefront');
        var selectedObjectName = component.get('v.selectedObjectName');

        console.log('selectedStorefront = ' + selectedStorefront);
        console.log('selectedObjectName = ' + selectedObjectName);

        helper.getUserInfo(component);

        helper.getStorefrontOptions(component);

        // Logic to handle when the [Previous] button
        var orderType = component.get('v.orderType');

        if(orderType == 'order') {
            helper.getOrders(component);
        }
        else if(orderType == 'cart') {
            helper.getCarts(component);
        }

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
            // New cart
            component.set('v.cartId', null);
            component.set('v.cartEncryptedId', null);
            component.set('v.selectedOrder', null);
            component.set('v.selectedOrderId', null);
            component.set('v.selectedObjectName', null);
        }

    },
    orderFormOptionChange : function(component, event, helper) {
        var changeValue = event.getParam("value");
        console.log('changeValue: ' + changeValue);
        component.set('v.orderType', changeValue);

        // Attempt to clear out variables when [Previous] is used in the flow
        if(changeValue == 'order') {
            component.set('v.cartId', null);
            component.set('v.cartEncryptedId', null);
        }
        else if(changeValue == 'cart') {
            component.set('v.selectedOrder', null);
            component.set('v.selectedOrderId', null);
        }
        else {
            component.set('v.cartId', null);
            component.set('v.cartEncryptedId', null);
            component.set('v.selectedOrder', null);
            component.set('v.selectedOrderId', null);
            component.set('v.selectedObjectName', null);
        }

        var orders = component.get('v.orders');
        if(changeValue == 'order' && orders.length == 0) {
            console.log('getting orders...');
            helper.getOrders(component);
        }

        var carts = component.get('v.carts');
        if(changeValue == 'cart' && carts.length == 0) {
            console.log('getting carts...');
            helper.getCarts(component);
        }
    },
    handleStorefrontChange : function(component, event, helper) {
        var storefront = component.find("selectStorefront").get("v.value");

        console.log("handleStorefrontChange: " + storefront);

        try {
            component.set("v.selectedStorefront", storefront);

            var orderType = component.get("v.orderType");

            if(storefront != null && storefront != '') {
                var orders = component.set('v.orders', []);
                if(orderType == 'order') {
                    console.log('getting orders...');
                    helper.getOrders(component);
                }

                var carts = component.set('v.carts', []);
                if(orderType == 'cart') {
                    console.log('getting carts...');
                    helper.getCarts(component);
                }
            }
        }
        catch(err) {
            console.log('error message: ' + err.message);
        }
    },
     waiting: function(component, event, helper) {
         component.set("v.HideSpinner", true);
     },
     doneWaiting: function(component, event, helper) {
         component.set("v.HideSpinner", false);
     },
     handleStartingObjectSelected: function(component, event, helper) {
        var objectType = event.getParam("objectType");
        var objectName = event.getParam("objectName");
        var objectId = event.getParam("objectId");
        var cartEncryptedId = event.getParam("cartEncryptedId");

        helper.clearCartSelections(component);
        helper.clearOrderSelections(component);

        if(objectType == "cart") {
            component.set("v.cartId", objectId);
            component.set("v.cartEncryptedId", cartEncryptedId);
            component.set("v.selectedObjectName", objectName);

            var someArray = component.get("v.carts");
            helper.selectObj(someArray, objectId);
            component.set("v.carts", someArray);
        }
        else if(objectType == "order") {
            component.set("v.selectedOrderId", objectId);
            component.set("v.cartEncryptedId", "");
            component.set("v.selectedObjectName", objectName);
            component.set("v.selectedOrder", objectName);

            var someArray = component.get("v.orders");
            helper.selectObj(someArray, objectId);
            component.set("v.orders", someArray);
        }

     },
     handleNavigateNext: function(component, event, helper) {

        var isValid = false;

        var messages = [];

        component.set("v.pageMessages", messages);

        var orderType = component.get("v.orderType");

        if(orderType == "new") {
            isValid = true;
        }

        if(orderType == "order") {
            var selectedOrderId = component.get("v.selectedOrderId");

            if(selectedOrderId != null && selectedOrderId != "") {
                isValid = true;
            }
            else {
                messages.push({'severity' : 'error', 'message' : "Please select an order" });
            }
        }

        if(orderType == "cart") {
            var cartId = component.get("v.cartId");

            if(cartId != null && cartId != "") {
                isValid = true;
            }
            else {
                messages.push({'severity' : 'error', 'message' : "Please select a cart" });
            }
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

            event.setParam("type", "c:ckz_OrderFormDataEntry");
            event.setParam("attributes", attrs);

            event.fire();

        }
        else {
            if(messages.length > 0) {
                component.set("v.pageMessages", messages);
            }
        }
    },
    contactSelectionChange: function(component, event, helper) {

        console.log('inside contactSelectionChange');

        var value = event.getParam("value");
        
        var userId = null;
        var userName = null;
        var contactId = null;
        var accountName = null;
        var accountGroupName = null;
        var accountId = null;
        
        if(value != null) {
            userId = value.Id;
            userName = value.Name;
            contactId = value.Contact.Id;
            accountName = value.Contact.Account.Name;
            accountId = value.Contact.Account.Id;
            accountGroupName = value.Contact.Account.ccrz__E_AccountGroup__r.Name;
        }

        component.set('v.contactId', contactId);
        component.set('v.userName', userName);
        component.set("v.accountGroupName", accountGroupName);
        component.set('v.userId', userId);
        component.set('v.accountId', accountId);
        component.set('v.accountName', accountName);

        // Need to set the default option.  The component may have been initially hidden.
        helper.setDefaultStorefrontOptions(component);

    },
    clearContact: function(component, event, helper) {
        component.set('v.contactId', null);
        component.set('v.userName', null);
        component.set("v.accountGroupName", null);
        component.set('v.userId', null);
        component.set('v.selItem', null);
    },

})