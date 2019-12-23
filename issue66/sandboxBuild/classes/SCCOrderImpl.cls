/**
* Impl class of order that implements interface
*
*
* @author  Neeraj Yadav
* @version 1.0
* @since   2018-01-15
*/
public class SCCOrderImpl implements SCCSynchronisedInterface {

    /**
    * This method is used by order sync lightening component
    * @param orderId: String
    * @return boolean.
    */
    public static boolean syncOrder(String orderId){
        SCCFileLogger logger = SCCFileLogger.getInstance();
        try {
            if(String.isEmpty(orderId)){
                throw new SObjectException('orderId is empty: '+orderId);
            }
            Order record = [SELECT Id, AccountId, Order_Contact__c, Name, SFCC_Order_Total__c, SFCC_Order_Number__c FROM Order WHERE Id =: orderId];
            SCCOrderImpl sCCOrderImpl = new SCCOrderImpl();
            sCCOrderImpl.continueWithObject(record);
            return true;
        } catch(Exception e) {
            logger.error('SCCOrderImpl.syncOrder', 'Exception message : '
                         + e.getMessage() + ' StackTrack '+ e.getStackTraceString());
            return false;
        } finally{
            logger.flush();
        }
    }


    /**
    * This method used for implementing related operations and update object status as Synchronised for order records
    * @param orderObj: SObject
    * @return None.
    */
    public void continueWithObject(SObject orderObj) {
        SCCFileLogger logger = SCCFileLogger.getInstance();
        try {
            Order record = (Order)orderObj;
            String body = SCCCommerceCloudConnect.getOrderDetails(record.SFCC_Order_Number__c, record.SFCC_Site_Id__c, SCCCommerceCloudConnect.connectToCommerceCloud());
            logger.debug('SCCOrderImpl.continueWithObject','response body: ' + body);
            Map<String, Object> jsonMap = (Map<String, Object>)System.JSON.deserializeUntyped(body);
            if(jsonMap.containsKey('customer_info')) {
                if(SCCUtilityClass.isPersonAccountEnabled()){
                    syncAccountOrder(record, jsonMap, logger);
                }else{
                    syncContactOrder(record, jsonMap, logger);
                }
                //Commented if you dont want to sync order items.
                upsertProductShipping(record, jsonMap, logger);
                upsertPaymentInformation(record, jsonMap, logger);
                //SCCOrderImpl.upsertReturnAndItems(record, jsonMap);
                syncOrderContactOrAccount(record, logger);
            }else{
                logger.error('SCCOrderImpl.continueWithObject','Invaid Order JSON response. customer_info missing');
            }
        }catch(Exception e){
            logger.error('SCCOrderImpl.continueWithObject', 'Exception message : '
                         + e.getMessage() + ' StackTrack '+ e.getStackTraceString());
        }finally{
            logger.flush();
        }
    }


    /**
    * This method is synchronise Account orders
    * @param record: Order
    * @param jsonMap: Map<String, Object>
    * @param logger: SCCFileLogger
    * @return None.
    */
    public static void syncAccountOrder(Order record, Map<String, Object> jsonMap, SCCFileLogger logger){
        SCCCommerceCloudConnect.logger = logger;
        Map<String, SObject> orderFieldMappings = SCCUtilityClass.getAllCustomSettingValues('Order', logger);
        if(!String.isEmpty(record.AccountId)
           && SCCUtilityClass.isPersonAccountExist(record.AccountId)){
            Account personAcc = [Select Id, PersonContactId from Account where isPersonAccount=True and Id =: record.AccountId];
            SObject obj = SCCUtilityClass.initializeObject(jsonMap, 'Order', orderFieldMappings, logger);
            obj.put('Id', record.Id);
            obj.put('Order_SCCSync_Status__c', 'Synchronised');
            obj.put('AccountId', personAcc.Id);
            obj.put('Order_Contact__c', personAcc.PersonContactId);
            obj.put('Status', 'Draft');
            obj.put('SFCC_CreatedBy__c', getCreatedBy(jsonMap));
            //obj.put('Status', 'Placed');
            Database.update(obj, true);
        }else{
            Map<String, Object> customerInfoMap = (Map<String, Object>)jsonMap.get('customer_info');
            List<Account> accountList = getPersonAccountByEmail((String)customerInfoMap.get('email'));
            if(!accountList.isEmpty()){
                SObject obj = SCCUtilityClass.initializeObject(jsonMap, 'Order', orderFieldMappings,logger);
                obj.put('Id', record.Id);
                obj.put('Order_SCCSync_Status__c', 'Synchronised');
                obj.put('AccountId', accountList[0].Id);
                obj.put('Order_Contact__c', accountList[0].PersonContactId);
                obj.put('Status', 'Draft');
                obj.put('SFCC_CreatedBy__c', getCreatedBy(jsonMap));
                Database.update(obj, true);
            }else{
                Map<String, SObject> accountFieldMappings = SCCUtilityClass.getAllCustomSettingValues('Account', logger);
                String resBody = SCCCommerceCloudConnect.searchCustomerByEmail((String)customerInfoMap.get('email'), record.SFCC_Site_Id__c, SCCCommerceCloudConnect.connectToCommerceCloud2ProfileOperations());
                logger.debug('SCCOrderImpl.syncAccountOrder','searchCustomerByEmail resBody: '+ resBody);
                Map<String, Object> resJsonMap = (Map<String, Object>)System.JSON.deserializeUntyped(resBody);
                if(resJsonMap.containsKey('hits')) {
                    List<Object> hitList = (List<Object>)resJsonMap.get('hits');
                    Map<String, Object> hitMap = (Map<String, Object>)hitList[0];
                    Map<String, Object> dataMap = (Map<String, Object>)hitMap.get('data');
                    resBody = SCCCommerceCloudConnect.getCustomerDetails((String)dataMap.get('customer_no'), record.SFCC_Site_Id__c, SCCCommerceCloudConnect.connectToCommerceCloud2ProfileOperations());
                    Map<String, Object> customerMap = (Map<String, Object>)System.JSON.deserializeUntyped(resBody);
                    Account accountRecord = (Account)SCCUtilityClass.initializeObject(customerMap, 'Account', accountFieldMappings, logger);
                    accountRecord = SCCUtilityClass.additionalFieldsforAccount(accountRecord, customerMap);
                    RecordType recordType = SCCUtilityClass.getPersonAccountRecordType('Person Account');
                    accountRecord.RecordTypeId = recordType.Id;
                    accountRecord.From_SFCC__pc = true;
                    Database.insert(accountRecord, true);
                    //Update account id in commerce cloud
                    //This is causing test case to fail as uncommitted work pending.
                    record.AccountId = accountRecord.Id;
                    record.Order_Contact__c = accountRecord.PersonContactId;
                    record.Order_SCCSync_Status__c = 'Synchronised';
                    record.Status = 'Draft';
                    record.SFCC_CreatedBy__c = getCreatedBy(jsonMap);
                    Database.update(record, true);
                    logger.debug('SCCOrderImpl.syncAccountOrder','accountRecord.Id: '+accountRecord.Id+' accountRecord.SFCC_Customer_Number__pc: '+accountRecord.SFCC_Customer_Number__pc);
                    updateCCCustomerProfile(accountRecord.Id, accountRecord.SFCC_Customer_Number__pc, accountRecord.SFCC_Site_Id__c);
                } else {
                    Account accountRecord = (Account)SCCUtilityClass.initializeObject(customerInfoMap, 'Account', accountFieldMappings, logger);
                    accountRecord = SCCUtilityClass.additionalFieldsforAccount(accountRecord, customerInfoMap);
                    RecordType recordType = SCCUtilityClass.getPersonAccountRecordType('Person Account');
                    accountRecord.RecordTypeId = recordType.Id;
                    accountRecord.From_SFCC__pc = true;
                    //Setting null as every guest customer id is same.
                    accountRecord.SFCC_Customer_Id__pc = null;
                    Database.insert(accountRecord, true);
                    record.AccountId = accountRecord.Id;
                    record.Order_Contact__c = accountRecord.PersonContactId;
                    record.Order_SCCSync_Status__c = 'Synchronised';
                    record.Status = 'Draft';
                    record.SFCC_CreatedBy__c = getCreatedBy(jsonMap);
                    Database.update(record, true);
                }
            }
        }
    }


    /**
    * This method is synchronise Contact orders
    * @param record: Order
    * @param jsonMap: Map<String, Object>
    * @param logger: SCCFileLogger
    * @return None.
    */
    public static void syncContactOrder(Order record, Map<String, Object> jsonMap, SCCFileLogger logger){
        Map<String, SObject> orderFieldMappings = SCCUtilityClass.getAllCustomSettingValues('Order', logger);
        Map<String, Object> tempMap = (Map<String, Object>)jsonMap.get('customer_info');
        List<Contact> contactList = getContactByEmail((String)tempMap.get('email'));
        if(!contactList.isEmpty()) {
            SObject obj = SCCUtilityClass.initializeObject(jsonMap, 'Order', orderFieldMappings, logger);
            obj.put('Id', record.Id);
            obj.put('Order_SCCSync_Status__c', 'Synchronised');
            obj.put('Order_Contact__c', contactList[0].Id);
            obj.put('Status', 'Draft');
            Database.update(obj, true);
        } else {
            Map<String, SObject> contactFieldMappings = SCCUtilityClass.getAllCustomSettingValues('Contact', logger);
            String resBody = SCCCommerceCloudConnect.searchCustomerByEmail((String)tempMap.get('email'), SCCCommerceCloudConnect.connectToCommerceCloud2ProfileOperations());
            logger.debug('SCCOrderImpl.syncContactOrder','searchCustomerByEmail resBody: '+ resBody);
            Map<String, Object> resJsonMap = (Map<String, Object>)System.JSON.deserializeUntyped(resBody);
            if(resJsonMap.containsKey('hits')) {
                List<Object> hitList = (List<Object>)resJsonMap.get('hits');
                Map<String, Object> hitMap = (Map<String, Object>)hitList[0];
                Map<String, Object> dataMap = (Map<String, Object>)hitMap.get('data');
                Map<String, Object> customerMap = (Map<String, Object>)System.JSON.deserializeUntyped(SCCCommerceCloudConnect.getCustomerDetails((String)dataMap.get('customer_no'), SCCCommerceCloudConnect.connectToCommerceCloud2ProfileOperations()));
                Contact contactRecord = (Contact)SCCUtilityClass.initializeObject(customerMap, 'Contact', contactFieldMappings, logger);
                contactRecord = SCCUtilityClass.additionalFieldsforContact(contactRecord, resJsonMap);
                contactRecord.from_SFCC__c = true;
                Database.insert(contactRecord, true);
                record.Order_Contact__c = contactRecord.Id;
                record.Order_SCCSync_Status__c = 'Synchronised';
                record.Status = 'Draft';
                Database.update(record, true);
                logger.debug('SCCOrderImpl.syncContactOrder','contactRecord.Id: '+contactRecord.Id+' contactRecord.SFCC_Customer_Number__c: '+contactRecord.SFCC_Customer_Number__c);
                updateCCCustomerProfile(contactRecord.Id, contactRecord.SFCC_Customer_Number__c);
            } else {
                Contact contactRecord = (Contact)SCCUtilityClass.initializeObject(tempMap, 'Contact', contactFieldMappings, logger);
                contactRecord = SCCUtilityClass.additionalFieldsforContact(contactRecord, tempMap);
                contactRecord.from_SFCC__c = true;
                Database.insert(contactRecord, true);
                record.Order_Contact__c = contactRecord.Id;
                record.Order_SCCSync_Status__c = 'Synchronised';
                record.Status = 'Draft';
                Database.update(record, true);
            }
        }
    }

    @future(callout=true)
    private static void updateCCCustomerProfile(Id recordId, String customerNo, String siteID){
        HttpResponse resp = SCCCommerceCloudConnect.updateCCCustomerProfile('{"c_sscid":"' + recordId + '"}', customerNo, siteID, SCCCommerceCloudConnect.connectToCommerceCloud2ProfileOperations());
    }

    /**
    * This method used for separate shipping and product details to upsert them under the related order record
    * @param record: Order
    * @param jsonMap, Map<String, Object>
    * @return None.
    */
    public static void upsertProductShipping(Order record, Map<String, Object> jsonMap, SCCFileLogger logger) {

        logger.debug('SCCOrderImpl.upsertProductShipping','record: ' + record);
        List<Order_Line_Item__c> orderLineItemList = new List<Order_Line_Item__c>();
        List<Shipment__c> shipmentList = new List<Shipment__c>();
        if(jsonMap.containsKey('product_items')) {
            orderLineItemList.addAll(SCCOrderImpl.determineProducts(record.Id, record.Order_Contact__c, jsonMap, logger));
        }
        if(jsonMap.containsKey('shipments')) {
            shipmentList.addAll(SCCOrderImpl.determineShippings(record.Id, record.Order_Contact__c, jsonMap, logger));
        }
        if(!orderLineItemList.isEmpty()) {
            System.debug('orderLineItemList:' + orderLineItemList);
            Database.upsert(orderLineItemList, true);
        }
        if(!shipmentList.isEmpty()) {
            System.debug('shipmentList:' + shipmentList);
            Database.upsert(shipmentList, true);
        }

    }
    
    /**
    * This method used for payment details to upsert them under the related order record
    * @param record: Order
    * @param jsonMap, Map<String, Object>
    * @return None.
    */
    public static void upsertPaymentInformation(Order record, Map<String, Object> jsonMap, SCCFileLogger logger) {
    
        logger.debug('SCCOrderImpl.upsertPaymentInformation','record: ' + record);
        List<Payment_Information__c> paymentInformationList = new List<Payment_Information__c>();
        if(jsonMap.containsKey('payment_instruments')) {
            paymentInformationList.addAll(SCCOrderImpl.determinePaymentInformation(record.Id, record.Order_Contact__c, jsonMap, logger));
        }
        if(!paymentInformationList.isEmpty()) {
            System.debug('paymentInformationList:' + paymentInformationList);
            Database.upsert(paymentInformationList, true);
        }
    }
    
    /**
    * This method used for determining products
    * @param recordId: Id
    * @param contactId: Id
    * @param jsonMap: Map<String, Object>
    * @return None.
    */
    private static List<Order_Line_Item__c> determineProducts(Id recordId, Id contactId, Map<String, Object> jsonMap, SCCFileLogger logger) {

        List<Order_Line_Item__c> returnList = new List<Order_Line_Item__c>();
        List<Object> productItemsList = (List<Object>)jsonMap.get('product_items');
        logger.debug('SCCOrderImpl.determineProducts','productItemsList: ' + productItemsList);
        
        for(Object obj : productItemsList) {
            Map<String, Object> productMap = (Map<String, Object>)obj;
            Order_Line_Item__c orderLineItem = new Order_Line_Item__c();

            //Changes to handle the duplicate records upon synchronisation
            
            String recordType = 'Order_Line_Item__c';
            String clause = 'ProductLineItemID__c = \'' + (String)productMap.get('item_id') + '\'';
            ensureUniqueRecords(recordType,clause, orderLineItem);
            
            //Setting the product options related attributes
            List<Object> optionItemsList = (List<Object>)productMap.get('option_items');
            if(optionItemsList!= NULL && !optionItemsList.isEmpty()){
                for(Object option_item: optionItemsList)
                {
                   Order_Line_Item__c optionOrderLineItem = new Order_Line_Item__c();
                   Map<String, Object> OptionItemMap = (Map<String, Object>)option_item;

                   //Ensure uniqueness of option product

                   String recordTypeOptions = 'Order_Line_Item__c';
                   String clauseOptions = 'ProductLineItemID__c = \'' + (String)OptionItemMap.get('item_id') + '\'';
                   ensureUniqueRecords(recordTypeOptions,clauseOptions, optionOrderLineItem);

                   //Setting the attributes of option product
                   optionOrderLineItem.ProductLineItemID__c = (String)OptionItemMap.get('item_id');
                   optionOrderLineItem.Name = (String)OptionItemMap.get('item_text'); 
                   optionOrderLineItem.Product_Id__c = (String)OptionItemMap.get('product_id'); 
                   optionOrderLineItem.Unit_Price__c  = (Decimal)OptionItemMap.get('base_price');
                   optionOrderLineItem.Order_Line_Item_Price__c  = (Decimal)OptionItemMap.get('price');
                   //Relating option items
                   optionOrderLineItem.Order_Line_Item_Product_Id__c  = (String)productMap.get('product_id');
                   optionOrderLineItem.Order__c = recordId;
                   optionOrderLineItem.Quantity__c = (Decimal)OptionItemMap.get('quantity');
                   returnList.add(optionOrderLineItem);       
                }
            }
            
            //Setting the PLI related attributes
            orderLineItem.ProductLineItemID__c = (String)productMap.get('item_id');
            orderLineItem.Unit_Price__c = (Decimal)productMap.get('base_price');
            orderLineItem.Variant_Info__c  = (String)productMap.get('c_variantInfo');
            orderLineItem.Name = (String)productMap.get('item_text');
            orderLineItem.Order_Line_Item_Price__c = (Decimal)productMap.get('price');
            orderLineItem.Price_After_Item_Discount__c = (Decimal)productMap.get('price_after_item_discount');
            orderLineItem.Price_After_Order_Discount__c = (Decimal)productMap.get('price_after_order_discount');
            orderLineItem.Product_Id__c = (String)productMap.get('product_id');
            orderLineItem.Product_Name__c  = (String)productMap.get('product_name');
            orderLineItem.Quantity__c = (Integer)productMap.get('quantity');
            orderLineItem.Tax__c  = (Decimal)productMap.get('tax');
            orderLineItem.Order__c = recordId;
            returnList.add(orderLineItem);
            
        }
        return returnList;
    }

    /**
    * This method used for determining shippings
    * @param recordId: Id
    * @param contactId: Id
    * @param jsonMap: Map<String, Object>
    * @return None.
    */
    private static List<Shipment__c> determineShippings(Id recordId, Id contactId, Map<String, Object> jsonMap, SCCFileLogger logger) {

        List<Shipment__c> returnList = new List<Shipment__c>();
        List<Object> shipmentItemList = (List<Object>)jsonMap.get('shipments');
        
        
        for(Object obj : shipmentItemList) {

            Map<String, Object> productMap = (Map<String, Object>)obj;
            Shipment__c shipmentItem = new Shipment__c();

            //Changes to handle the duplicate records upon synchronisation.ApexPages
            
            String recordType = 'Shipment__c';
            String clause = 'Shipment_No__c = \'' + (String)productMap.get('shipment_no') + '\'';
            ensureUniqueRecords(recordType,clause, shipmentItem);
            
            //Setting the values in Shipment object
            
            shipmentItem.Name = (String)productMap.get('item_text');
            shipmentItem.Order__c = recordId;
            shipmentItem.Shipment_No__c = (String)productMap.get('shipment_no');
            Map <String, Object> addr = (Map <String, Object>) productMap.get('shipping_address');
            Map <String, Object> method = (Map <String, Object>) productMap.get('shipping_method');
            shipmentItem.Shipping_Address__c  = (String)getShippingAddress(addr);
            shipmentItem.Shipment_Contact__c  = (String)getShipmentContact(addr);
            shipmentItem.Shipping_Method__c  = (String)getShippingMethod(method);
            shipmentItem.Shipment_Total__c = (Decimal)productMap.get('shipment_total');
            shipmentItem.Shipping_Total__c = (Decimal)productMap.get('shipping_total');
            shipmentItem.Shipping_Total_Tax__c = (Decimal)productMap.get('shipping_total_tax');
            shipmentItem.Tracking_Number__c = (String)productMap.get('tracking_number');
            returnList.add(shipmentItem);
        }
        return returnList;

    }

    private static String getShippingAddress(Map<String, Object> addr){
        // System.debug('Address: ' + addr);
        String result = '';
        result += addr.get('address1').toString() + ', ';
	if (addr.get('address2') != null) {
            result += addr.get('address2').toString() + ', ';
        }
        result += addr.get('city').toString() + ', ';
        result += addr.get('state_code').toString() + ' ';
        result += addr.get('postal_code').toString();
        // System.debug('Address result: ' + result);
	return result;
    }

    private static String getShippingMethod(Map<String, Object> method){
        // System.debug('Method: ' + method);
        // System.debug('Method result: ' + method.get('name').toString());
        return method.get('name').toString();
    }

    private static String getShipmentContact(Map<String, Object> addr){
        return 'Name: ' + addr.get('full_name').toString() + ', Phone: ' + addr.get('phone').toString();
    }
    
    /**
    * This method used for determining payment information
    * @param recordId: Id
    * @param contactId: Id
    * @param jsonMap: Map<String, Object>
    * @return List<Payment_Information__c>.
    */
    private static List<Payment_Information__c> determinePaymentInformation(Id recordId, Id contactId, Map<String, Object> jsonMap, SCCFileLogger logger) {

		List<Payment_Information__c> returnList = new List<Payment_Information__c>();
        List<Object> paymentInstructionsList = (List<Object>)jsonMap.get('payment_instruments');
        
        //Loop through all the payment instruments
        for(Object obj : paymentInstructionsList) {
            Map<String, Object> paymentInstructionMap = (Map<String, Object>)obj;
            Map<String, Object> paymentCard = (Map<String, Object>)paymentInstructionMap.get('payment_card');
            Payment_Information__c PaymentInformationItem = new Payment_Information__c();

            
            //Changes to handle the duplicate records upon synchronisation
            String recordType = 'Payment_Information__c';
            String clause = 'Payment_Instrument_Id__c = \'' + (String)paymentInstructionMap.get('payment_instrument_id') + '\'';
            ensureUniqueRecords(recordType,clause, PaymentInformationItem);
            
            //Setting the payment instrument attributes
            PaymentInformationItem.Payment_Instrument_Id__c = (String)paymentInstructionMap.get('payment_instrument_id');
            PaymentInformationItem.Amount_Charged_to_Card__c = (Decimal)paymentInstructionMap.get('amount');
            PaymentInformationItem.Card_Number__c = (String)paymentCard.get('masked_number');
            PaymentInformationItem.Expiration__c = paymentCard.get('expiration_month') + '/' + paymentCard.get('expiration_year');
            PaymentInformationItem.Cardholder_Name__c  = (String)paymentCard.get('holder');
            PaymentInformationItem.Name = (String)paymentCard.get('card_type');
            PaymentInformationItem.Payment_Method__c = (String)paymentInstructionMap.get('payment_method_id');
            PaymentInformationItem.Order__c = recordId;
            returnList.add(PaymentInformationItem);
        }
        return returnList;

    }
    
    private static boolean syncOrderContactOrAccount(Order obj, SCCFileLogger logger){
        if(SCCUtilityClass.isPersonAccountExist(obj.AccountId)){
            SCCCommerceCloudConnect.scheduleIt(obj.AccountId);
        }else if(!String.isEmpty(obj.Order_Contact__c)){
            SCCCommerceCloudConnect.scheduleIt(obj.Order_Contact__c);
        }else{
            return false;
        }
        return true;
    }

    private static List<Account> getPersonAccountByEmail(String email){
        List<Account> accounts;
        try{
            accounts = [Select Id, PersonEmail, PersonContactId from Account where isPersonAccount = true and PersonEmail = :email];
            return accounts;
        }catch(Exception e){
           return accounts;
        }
    }


    private static List<Contact> getContactByEmail(String email){
        String query = SCCQueryUtilClass.getInstance()
            .getQueryInstance()
            .setObjectName('Contact')
            .setRelatedFields(new Set<String>{'Id', 'Email'})
            .setClause('Email', '=', '\'' + email + '\'')
            .getQuery();
        return (List<Contact>)SCCQueryUtilClass.getRecords(query);
    }

    /**
    * This method used to determine the created_by field value from SFCC order response.A
    * For Guest Users value woule be 'strorefront', 'registered user' for loggedin users & aent user-name for the CSR orders
    * @param jsonMap: Map<String, Object>
    * @return createdByValue: String.
    */
    private static String getCreatedBy(Map<String, Object> jsonMap){
        String createdByValue;
        if(jsonMap != null && !jsonMap.isEmpty()){
            //First check the created_by value - both for registered & guest, the value of this attribute will be 'Customer'.
            if(jsonMap.get('created_by') != null &&  jsonMap.get('created_by').toString().equalsIgnoreCase('Customer')){
                //check customer_info.customer_no - for registered users, this attribute will be present in response but not for guest orders.
                if(jsonMap.containsKey('customer_info') && ((Map<String, Object>)jsonMap.get('customer_info')).get('customer_no') != null){//Registered customer order
                    createdByValue  = 'registered user';
                }else{//Guest order
                    createdByValue  = 'storefront';
                }
            }else if(jsonMap.get('created_by') != null){//Agent order
                createdByValue  =  jsonMap.get('created_by').toString();
            }
        }
        return createdByValue;
    }

    /**
    * This method used for upsert return and separate return items
    * @param record: Order
    * @param jsonMap: Map<String, Object>
    * @return None.

    public static void upsertReturnAndItems(Order record, Map<String, Object> jsonMap) {

        System.debug('record ==>> ' + record);
        if(jsonMap.containsKey('returns')) {
            List<Object> objList = (List<Object>)jsonMap.get('returns');
            Map<String, Object> tempMap = (Map<String, Object>)objList[0];
            Return__c ret = [SELECT Id, Name, Order__c, Status__c FROM Return__c WHERE Order__c =: record.SFCC_Orde_Number__c];
            Database.update(ret);
            List<Return_Item__c> returnItemList = new List<Return_Item__c>();
            if(tempMap.containsKey('return_items')) {
                returnItemList.addAll(kOrderImpl.determineReturnItems(ret.Id, tempMap));
            }
            if(!returnItemList.isEmpty()) {
                Database.insert(returnItemList, true);
            }
        }

    }

    /**
    * This method used for insert return items
    * @param returnId: Id
    * @param jsonMap: Map<String, Object>
    * @return None.

    public static List<Return_Item__c> determineReturnItems(Id returnId, Map<String, Object> jsonMap) {

        List<Return_Item__c> returnList = new List<Return_Item__c>();
        List<Object> objList = (List<Object>)jsonMap.get('return_items');
        for(Object obj : objList) {
            Map<String, Object> tempMap = (Map<String, Object>)obj;
            Return_Item__c ri = new Return_Item__c(  Return__c = returnId  );
            returnList.add(ri);
        }
        return returnList;

    }
    */
    
    /**
    * This method is used to avoid duplicate Shipments, PaymentInstruments & ProductLineItems in an order.
    * @param relatedFields: Set<String>
    * @param recordType: String
    * @param clause: String
    * @param recordObject: SObject
    * @return None.
    */
    private static void ensureUniqueRecords(String recordType, String clause, SObject recordObject){
        Set<String> relatedFields = new Set<String>{'Id'};
        String query = SCCQueryUtilClass.getInstance()
                                        .getQueryInstance()
                                        .setObjectName(recordType)
                                        .setRelatedFields(relatedFields)
                                        .setClause(clause)
                                        .getQuery();
        List<SObject> lineItemsList = (List<SObject>)SCCQueryUtilClass.getRecords(query);
        if(!lineItemsList.isEmpty()) {
            recordObject.Id = lineItemsList[0].Id;
        }
    }

}