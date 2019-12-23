({
    doInit : function(component, event, helper) {
        component.set('v.modelFactorValues', helper.modelFactorValues);
        component.set('v.factor1Options', helper.factor1Options);
        component.set('v.factor2Options', helper.factor2Options);
    },
    confidenceChangeHandler : function(component, event, helper){
        let insight = component.get('v.insight');
        let intensity = insight.IntensityLevel.split('_');
        let intensityLevel = intensity[0];
        let intensityTrend = intensity[1];
        
        switch(intensityLevel){
            case 'HIGH': insight.Intensity = 0.9;
                break;
            case 'MEDIUM': insight.Intensity = 0.6;
                break;
            default: insight.Intensity = 0.3;
        }
        
        if(intensityTrend === 'NEG') {
            insight.Intensity = -insight.Intensity
        } else {
            insight.Intensity = insight.Intensity
        }
        console.log(insight);
        component.set('v.insight', insight);
    },
    deleteIndex : function(component, event, helper){
        let deleteIndex = component.getEvent("deleteIndex");
        deleteIndex.setParams({
            index: component.get('v.index'),
            payload: component.get('v.insight')
        })
        deleteIndex.fire();
    }
})