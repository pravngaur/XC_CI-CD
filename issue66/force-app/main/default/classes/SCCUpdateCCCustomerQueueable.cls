global class SCCUpdateCCCustomerQueueable implements Queueable, Database.AllowsCallouts {
    
    private Id recordId;
    private String customerNo;
    private String accessToken;
    private String siteID;
    
    public SCCUpdateCCCustomerQueueable(Id recordId, String customerNo, String accessToken, String siteID){
        this.recordId = recordId; 
        this.customerNo = customerNo;
        this.accessToken = accessToken;
        this.siteID = siteID;
        System.debug('SCCUpdateCCCustomerQueueable' + 'inputs: '+this.recordId+' : ' + this.customerNo);
    }
    
    global void execute(QueueableContext context){
        System.debug('SCCUpdateCCCustomerQueueable.execute');
        updateCCCustomerProfile(recordId, customerNo, accessToken);
    }
    
    @future(callout=true)
    private static void updateCCCustomerProfile(Id recordId, String customerNo, String accessToken, String siteID){
        System.debug('SCCUpdateCCCustomerQueueable:updateCCCustomerProfile' + ' recordId: ' + recordId + ' customerNo: ' + customerNo);
        HttpResponse resp = SCCCommerceCloudConnect.updateCCCustomerProfile('{"c_sscid":"' + recordId + '"}', customerNo, siteID, accessToken);         
    }
}