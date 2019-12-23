const scDeployment = require("./scDeployment");
const sfccDeployment = require("./sfccDeployment");

//SC Deployment first
scDeployment.auth();
scDeployment.build();
scDeployment.createArchive();
scDeployment.deployBuild()


//SFCC Deployment then
sfccDeployment.auth();
sfccDeployment.gitCloneAndDeploy();