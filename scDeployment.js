var cmd=require('node-cmd');
 
function auth(){
    cmd.get(
        `
        sfdx force:auth:web:login -r https://test.salesforce.com
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

function build(){
    cmd.get(
        `
        cd issue66
        sfdx force:source:convert --rootdir force-app --outputdir sandboxBuild
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


function createArchive(){
    cmd.get(
        `
            cd issue66
            zip -r -X sandboxBuild.zip sandboxBuild
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

function deployBuild(){
    cmd.get(
        `
        cd issue66
        sfdx force:mdapi:deploy --zipfile sandboxBuild.zip --targetusername pgaur_sc_fixes@pgaur-20190815.demo.demosb
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
module.exports.scDeployment = {
    auth: auth,
    build: build,
    createArchive: createArchive,
    deployBuild: deployBuild
}

