/**
 * Created by msobczak on 11/7/2018.
 */
({
    selectOrder: function(component, event, helper) {
        console.log('inside selectOrder');

        var selectedItem = event.currentTarget;
        var orderName = component.get('v.currentOrderName');
        var orderId = component.get('v.currentOrderId');

        console.log('orderName = ' + orderName);
        console.log('orderId = ' + orderId);

        //component.set('v.selectedOrder', orderName);
        //component.set('v.selectedOrderId', orderId);

        var event = component.getEvent("startingObjectSelected");

        event.setParam("objectType", "order");
        event.setParam("objectName", orderName);
        event.setParam("objectId", orderId);
        event.setParam("cartEncryptedId", "");

        event.fire();

    },
    handleGotoDataEntry: function(component, event, helper) {
        var event = component.getEvent("gotoDataEntry");

        event.setParam("screen", "ckz_OrderFormDataEntry");

        event.fire();
    }
})