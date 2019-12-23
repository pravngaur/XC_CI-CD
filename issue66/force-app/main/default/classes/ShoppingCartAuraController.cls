public with sharing class ShoppingCartAuraController {
    
    static SCCFileLogger logger = SCCFileLogger.getInstance();
    
	@AuraEnabled
	public static String getAccessToken(String recordId, String objectName) {
        SCCCommerceCloudConnect.logger = logger;
        String customerAuthToken = null;
        try{
            String agentAccessToken = SCCCommerceCloudConnect.connectToCommerceCloud();
            logger.debug('ShoppingCartAuraController', 'getAccessToken : '+ agentAccessToken); 
            if(agentAccessToken!=null && agentAccessToken!='' ){
                String sfccCustomerID = getSFCCCustomerIdById(recordId, objectName, logger);
                customerAuthToken = SCCCommerceCloudConnect.getCustomerAuthToken(agentAccessToken, sfccCustomerID); 
            }
            logger.debug('ShoppingCartAuraController', 'getAccessToken-customerAuthToken : '+ customerAuthToken);     
            return customerAuthToken;
        }catch(Exception e){
            logger.error('ShoppingCartAuraController.getAccessToken', 'Exception message : '
                         + e.getMessage() + ' StackTrack '+ e.getStackTraceString());  
            return customerAuthToken;
        }finally{
            logger.flush();
        }
	}

	@AuraEnabled
	public static String getStoreSessionURL() {
        String storeSessionURL = null;
        storeSessionURL = SCCCommerceCloudConnect.siteBaseUrl+'/s/'+SCCCommerceCloudConnect.siteId+'/dw/shop/v17_4/sessions';
        return storeSessionURL;
	}

	@AuraEnabled
	public static String getStoreFrontURL() {
        String storeFrontURL = null;
        storeFrontURL = SCCCommerceCloudConnect.siteBaseUrl+'/on/demandware.store/Sites-'+SCCCommerceCloudConnect.siteId+'-Site';
        return storeFrontURL;
	}
    
    /**
     *
     * Method to determine the SFCC Customer ID. expects SC record ID as an argument.
     * Checks if a given customer is a registered user or a guest. 
     * Returns the ID of the placeHolder cusomer -- if the record ID belongs to a guest customer. For registered customers - their own ID is returned.
     * 
     * @param recordId : ID
     * @param objectName : String
     * @param logger : SCCFileLogger
     * @return sfccCustomerID : String
     *
     */
	public static String getSFCCCustomerIdById(Id recordId, String objectName, SCCFileLogger logger) {
        String sfccCustomerID = null;
        if(SCCUtilityClass.isPersonAccountEnabled()){
            logger.debug('ShoppingCartAuraController.getSFCCCustomerIdById', 'Person accoun enabled. getting SFCC Customer id from person account');
            if(objectName == 'Account'){
                Account account = [SELECT Id, SFCC_Customer_Id__pc, SFCC_Customer_Number__pc FROM Account WHERE Id = :recordId]; 
                if(account != null) {

                    //if SFCC_Customer_Number__pc isn't present in fieldsToValueMap then guest customer else registered

                    Map<String, Object> fieldsToValueMap = account.getPopulatedFieldsAsMap();
                    String sfccCustomerNumber = (String) fieldsToValueMap.get('SFCC_Customer_Number__pc');
                    if(String.isNotBlank(sfccCustomerNumber)){
                        sfccCustomerID = account.SFCC_Customer_Id__pc;
                    }else{
                        sfccCustomerID = guestCustomerRecordID;
                    }
                }
            }else if(objectName == 'Case'){
                Case[] records = [SELECT Id, Account.Id, Account.SFCC_Customer_Id__pc, Account.SFCC_Customer_Number__pc, ContactEmail FROM Case WHERE Id = :recordId]; 
                if(!records.isEmpty()) {
                    
                    //if SFCC_Customer_Number__pc isn't present in fieldsToValueMap then guest customer else registered

                    if(String.isNotBlank(records[0].Account.SFCC_Customer_Number__pc)){
                        sfccCustomerID = records[0].Account.SFCC_Customer_Id__pc;
                    }else{
                        sfccCustomerID = guestCustomerRecordID;
                    }
                }
            }           
        }
        logger.debug('ShoppingCartAuraController.getSFCCCustomerIdById','Returning SFCC Customer ID: '+sfccCustomerID);
		return sfccCustomerID;
	}

    /* specified site id on commerce cloud */
    public static String guestCustomerRecordID {
        get { 
            if(String.isBlank(guestCustomerRecordID)) {
                String query = SCCQueryUtilClass.getInstance()
                                          .getQueryInstance()
                                          .setObjectName('SFCCConfiguration__c')
                                          .setRelatedFields(new Set<String>{'Id', 'Name', 'Placeholder_SFCC_Customer_ID__c'})
                                          .setLimit('1')
                                          .getQuery();
                List<SFCCConfiguration__c> objList = (List<SFCCConfiguration__c>)SCCQueryUtilClass.getRecords(query);
                guestCustomerRecordID = objList[0].Placeholder_SFCC_Customer_ID__c;
            }
            return guestCustomerRecordID;            
        }
        set;
    }

}