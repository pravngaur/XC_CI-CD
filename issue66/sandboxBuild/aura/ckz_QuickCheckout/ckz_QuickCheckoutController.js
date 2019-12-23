/**
 * Created by msobczak on 11/27/2018.
 */
({
    doInit: function(component, event, helper) {
        console.log('ckz_QuickCheckout - begin init()');

        var userId = component.get('v.userId');
        var locale = component.get('v.locale');
        var selectedStorefront = component.get('v.selectedStorefront');
        var currencyCode = component.get('v.currencyCode');
        var cartId = component.get('v.cartId');
        var cartEncryptedId = component.get('v.cartEncryptedId');
        var accountId = component.get('v.accountId');

        console.log('userId = ' + userId);
        console.log('locale = ' + locale);
        console.log('selectedStorefront = ' + selectedStorefront);
        console.log('cartId = ' + cartId);
        console.log('cartEncryptedId = ' + cartEncryptedId);
        console.log('accountId = ' + accountId);

        helper.startCheckout(component, userId, selectedStorefront, currencyCode, accountId, locale, cartId, cartEncryptedId);

        console.log('ckz_QuickCheckout - exit init()');

    },
    handleSubmitOrder: function(component, event, helper) {
        helper.submitOrder(component);
    },
    waiting: function(component, event, helper) {
        component.set("v.HideSpinner", true);
    },
    doneWaiting: function(component, event, helper) {
        component.set("v.HideSpinner", false);
    },
    /*
                        <div class="slds-col">
                            <lightning:button aura:id="doFinish"
                                            label="Finish"
                                            class="slds-m-top--medium"
                                            variant="neutral"
                                            onclick="{!c.handleNavigateFinish}" />
                        </div>

    */
    handleNavigateFinish: function(component, event, helper) {

        var isValid = false;

         var messages = [];

         component.set("v.pageMessages", messages);

         var orderProcessed = component.get("v.orderProcessed");

         if(orderProcessed)
         {
             isValid = true;
         }
         else {
             messages.push({'severity' : 'error', 'message' : "Please click [Place Order] to submit your order" });
         }

         if(messages.length == 0) {
             isValid = true;
         }
         else {
             component.set("v.pageMessages", messages);
             // for Display Model,set the "isOpen" attribute to "true"
             component.set("v.isOpen", true);
         }

         if(isValid) {
             var navigate = component.get("v.navigateFlow");
             navigate("FINISH");
         }

     },
     handleQuickCheckoutDialogEvent: function(component, event, handler) {

         var action = event.getParam("action");

         if(action == "FINISH") {
            var navigate = component.get("v.navigateFlow");
            navigate(action);
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

         event.setParam("type", "c:ckz_OrderFormDataEntry");
         event.setParam("attributes", attrs);

         event.fire();

     },
   handleNavigateStartOver: function(component, event, helper) {

        var attrs = {};

        attrs.contactId = component.get("v.contactId");
        attrs.userId = component.get("v.userId");
        attrs.accountId = component.get("v.accountId");
        attrs.locale = component.get("v.locale");
        attrs.selectedStorefront = component.get("v.selectedStorefront");
        attrs.selectedOrder = '';
        attrs.selectedOrderId = '';
        attrs.cartId = '';
        attrs.cartEncryptedId = '';
        attrs.orderType = '';
        attrs.currencyCode = component.get("v.currencyCode");
        attrs.selectedObjectName = '';
        attrs.recordId = component.get('v.recordId');

        attrs.userName = component.get('v.userName');
        attrs.accountGroupName = component.get('v.accountGroupName');
        attrs.accountName = component.get('v.accountName');

        var event = component.getEvent("renderPanel");

        event.setParam("type", "c:ckz_OrderFormStart");
        event.setParam("attributes", attrs);

        event.fire();

   }
})