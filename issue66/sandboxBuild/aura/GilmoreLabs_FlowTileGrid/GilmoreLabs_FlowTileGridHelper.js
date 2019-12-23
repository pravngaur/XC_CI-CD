({
	fetchdata: function (cmp)
    {
        var action = cmp.get("c.getData");
        action.setParams({ "lstInput" : cmp.get("v.lstInput"), "strObjectName" : cmp.get("v.strObjectName"), "strSubjectTemplate" : cmp.get("v.strSubjectTemplate"), "strDescriptionTemplate" : cmp.get("v.strDescriptionTemplate") });
        // Create a callback that is executed after 
        // the server-side action returns
        action.setCallback(this, function(response) 
        {
            //alert('returned: ' + response.getReturnValue());
            var state = response.getState();
            if (state === "SUCCESS") {
                cmp.set('v.tileItems', response.getReturnValue());
                cmp.set("v.Spinner", false);
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
})