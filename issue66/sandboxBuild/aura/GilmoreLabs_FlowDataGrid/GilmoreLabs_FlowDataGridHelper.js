({
    fetchColumns: function (cmp)
    {
        var action = cmp.get("c.getColumnString");
        action.setParams({ "objectName" : cmp.get("v.strObjectName"), "fields" : cmp.get("v.strFields"), "openRecordField" : cmp.get("v.strObjectLink") });
        // Create a callback that is executed after 
        // the server-side action returns
        action.setCallback(this, function(response) 
        {
            //alert('returned: ' + response.getReturnValue());
            var state = response.getState();
            if (state === "SUCCESS") {
                var jsonColumns = JSON.parse(response.getReturnValue());
                cmp.set('v.columns', jsonColumns);
            }
            else if (state === "INCOMPLETE") {
                // do something
            }
            else if (state === "ERROR") {
                var errors = response.getError();
                if (errors) {
                    if (errors[0] && errors[0].message) {
                        console.log("Error message: " + 
                                 errors[0].message);
                    }
                } else {
                    console.log("Unknown error");
                }
            }
        });
        $A.enqueueAction(action);
    },
    
    fetchData: function (cmp) 
    {
        var action = cmp.get("c.getDataString");
        action.setParams({ "lstIds" : cmp.get("v.lstIds"), "objectName" : cmp.get("v.strObjectName"), "fields" : cmp.get("v.strFields"), "openRecordField" : cmp.get("v.strObjectLink") });
        // Create a callback that is executed after 
        // the server-side action returns
        action.setCallback(this, function(response) 
        {
            //alert('returned: ' + response.getReturnValue());
            var state = response.getState();
            if (state === "SUCCESS") {
                var jsonData = JSON.parse(response.getReturnValue());
                cmp.set('v.data', jsonData);
                cmp.set("v.Spinner", false);
                
                //Pre-select the selected rows
                var lstpreSelectedIds = cmp.get("v.lstpreSelectedIds");
                cmp.set('v.firstSelectedId', null);
                if (lstpreSelectedIds != null)
                {
                    // Workaround to selectRows
                    cmp.set('v.selectedRowsCount', lstpreSelectedIds.length);
                    var cmpTable = cmp.find("beachTable");
                    cmpTable.set("v.selectedRows", lstpreSelectedIds);
                    cmp.set('v.lstSelectedIds', lstpreSelectedIds);
                    
                    if (lstpreSelectedIds.length > 0)
                    {
                        cmp.set('v.firstSelectedId', lstpreSelectedIds[0]);
                    }
                }
            }
            else if (state === "INCOMPLETE") {
                // do something
            }
            else if (state === "ERROR") {
                var errors = response.getError();
                if (errors) {
                    if (errors[0] && errors[0].message) {
                        console.log("Error message: " + 
                                 errors[0].message);
                    }
                } else {
                    console.log("Unknown error");
                }
            }
        });
        $A.enqueueAction(action);
    }
})