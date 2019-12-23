/**
 * Created by msobczak on 11/11/2018.
 */
({
    selectCart: function(component, event, helper) {
        console.log('ckz_RetrievedCartDetail - inside selectCart()');

        var selectedItem = event.currentTarget;

        // The current cart id and encrypted ID represent the row of cart detail being displayed by this compoent.
        var currentCartId = component.get('v.currentCartId');
        var currentCartEncryptedId = component.get('v.currentCartEncryptedId');
        var currentCartName = component.get("v.currentCartName");

        console.log('currentCartId = ' + currentCartId);
        console.log('currentCartEncryptedId = ' + currentCartEncryptedId);

        var event = component.getEvent("startingObjectSelected");

        event.setParam("objectType", "cart");
        event.setParam("objectName", currentCartName);
        event.setParam("objectId", currentCartId);
        event.setParam("cartEncryptedId", currentCartEncryptedId);

        event.fire();

    },
    handleGotoDataEntry: function(component, event, helper) {
        var event = component.getEvent("gotoDataEntry");

        event.setParam("screen", "ckz_OrderFormDataEntry");

        event.fire();
    }
})