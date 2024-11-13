Section 1:
Pre-requiest steps for creating service account for first time in local machine:
step 1: configure the google cloud authentication using gcloud auth login command
step 2: set the Azuredevops personal access token
eg: for windows run : SET AZDO_PERSONAL_ACCESS_TOKEN="Pass_ZDO_PERSONAL_ACCESS_TOKEN"
                      SET AZDO_ORG_SERVICE_URL="Pass_AZDO_ORG_SERVICE_URL"
step 3: run the terraform init command locally to initizalation and backend configration
step 4: run the terraform plan command locally to see the resource provisioning details
step 4: run the terraform apply command locally to provisioning the resource


Section 2:
step 1: Currently we are building and deploying nodejs application using docker file and pushing the image to google container registery.

step 2: Application deployment of nodejs is deployed using AzureDevops pipeline

step 3: Application deployment of nodejs is deployed using GCP CloudBuild pipeline

step 4: Application deployment of nodejs is deployed using Jenkins Pipelines(JPAC/Groovy Scripts) 
i. Make sure that terraform, docker and python(pip) installed on the jenkins server
ii. Add the serviceaccount(serviceconnectionsrv) json key file in jenkins credentials name as "gcp-service-account-key"
iii. Add the git credentails username and password in the jenkins credentials

step 5: Application deployment of nodejs is deployed using GithubActions
i. Add the serviceaccount(serviceconnectionsrv) json key file content in secret variable name as "GCP_SA_KEY"

step 6: Application deployment of nodejs is deployed using GitLab
i. Add the serviceaccount(serviceconnectionsrv) json key file content in secret variable name as "GCP_SA_KEY"