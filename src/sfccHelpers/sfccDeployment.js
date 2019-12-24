var cmd=require('node-cmd');

function sfccAuth(){
    cmd.get(
        `
        sfcc-ci auth:login 0fcb271a-ec93-4e80-b0b4-42049aa95824
        `,
        function(err, data, stderr){
            if (!err) {
            console.log('the node-cmd cloned dir contains these files :\n\n',data)
            } else {
            console.log('error', err)
            }

        }
    );
}

 
function gitCloneAndDeploy(){
    cmd.get(
        `
        mkdir sfccCodeBase
        cd sfccCodeBase
        mkdir storefront
        cd storefront
        git clone https://github.com/SalesforceCommerceCloud/storefront-reference-architecture.git
        cd ..
        mkdir scconnector
        cd scconnector
        git clone https://github.com/SalesforceCommerceCloud/service-cloud-connector.git
        cd ..
        cp -R ./scconnector/service-cloud-connector/b2c/sfcc/cartridges/int_service_cloud ./storefront/storefront-reference-architecture/cartridges/int_service_cloud
        cp -R ./scconnector/service-cloud-connector/b2c/sfcc/cartridges/plugin_service_cloud ./storefront/storefront-reference-architecture/cartridges/plugin_service_cloud
        
        mkdir buildArchive
        pwd
        zip -r -X ./buildArchive/connector.zip ./storefront/storefront-reference-architecture/cartridges/
        
        sfcc-ci code:deploy ./buildArchive/connector.zip -i zzpa-003
        sfcc-ci code:activate connector -i zzpa-003
        sfcc-ci cartridge:add int_service_cloud -p first
        sfcc-ci cartridge:add plugin_service_cloud -p first
        
        `,
        function(err, data, stderr){
            if (!err) {
            console.log('the node-cmd cloned dir contains these files :\n\n',data)
            } else {
            console.log('error', err)
            }

        }
    );
}
module.exports.sfccDeployment = {
    sfccAuth: sfccAuth,
    gitCloneAndDeploy: gitCloneAndDeploy
}