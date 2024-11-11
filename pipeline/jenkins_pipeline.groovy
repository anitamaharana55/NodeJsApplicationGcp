pipeline {
    agent any
    parameters {
        string(name: 'IMAGE_NAME', defaultValue: 'nodejsapp', description: 'Node.js app image')  // Image name parameter
        string(name: 'IMAGE_VERSION', defaultValue: '3.0.0', description: 'Version tag for the Docker image')    // Version tag parameter
    }
    environment {
        GCP_PROJECT_ID = 'gcp-cloudrun-nodejs-mysql-app'      // Replace with your GCP project ID
        GCP_CREDENTIALS = credentials('gcp-service-account-key') // Replace with your Jenkins Credential ID
        GCR_HOST = 'gcr.io'                         // Change to 'us.gcr.io', 'eu.gcr.io', or 'asia.gcr.io' as needed
        DOCKERFILE_PATH = './gcp_nodejs_app/Dockerfile' // Path to your Dockerfile
        CONTEXT_PATH = './gcp_nodejs_app/'            // Path to the Docker build context
        GIT_REPO_URL = 'https://github.com/anitamaharana55/NodeJsApplicationGcp.git' // Replace with your Git repository URL
        GIT_CREDENTIALS_ID = 'git-credentials-id'    // Jenkins credential ID for Git (if needed)
    }
    stages {
        stage('Checkout Code') {
            steps {
                // Cloning the repository
                checkout([$class: 'GitSCM', 
                    branches: [[name: '*/main']],          // Change 'main' to your branch name
                    userRemoteConfigs: [[url: "${GIT_REPO_URL}", credentialsId: "${GIT_CREDENTIALS_ID}"]]
                ])
            }
        }
        stage('Authenticate to GCP') {
            steps {
                // Using the GCP service account key as a secret file
                withCredentials([file(credentialsId: 'gcp-service-account-key', variable: 'GCP_KEY_FILE')]) {
                    script {
                        // Authenticate using the secret file path
                        sh 'gcloud auth activate-service-account --key-file=$GCP_KEY_FILE'
                        sh 'gcloud config set project ${GCP_PROJECT_ID}'
                    }
                }
            }
        }
        stage('Docker Login to GCR') {
            steps {
                script {
                    // Login to Google Container Registry
                    sh "gcloud auth configure-docker ${GCR_HOST}"
                }
            }
        }
        stage('Build Docker Image') {
            steps {
                script {
                    // Build the Docker image and tag it with both version and latest tags
                    sh """
                    docker build -t ${GCR_HOST}/${GCP_PROJECT_ID}/${params.IMAGE_NAME}:${params.IMAGE_VERSION} -f ${DOCKERFILE_PATH} ${CONTEXT_PATH}
                    docker tag ${GCR_HOST}/${GCP_PROJECT_ID}/${params.IMAGE_NAME}:${params.IMAGE_VERSION} ${GCR_HOST}/${GCP_PROJECT_ID}/${params.IMAGE_NAME}:latest
                    """
                }
            }
        }
        stage('Push Docker Image to GCR') {
            steps {
                script {
                    // Push both the versioned and latest tagged Docker images to GCR
                    sh "docker push ${GCR_HOST}/${GCP_PROJECT_ID}/${params.IMAGE_NAME}:${params.IMAGE_VERSION}"
                    sh "docker push ${GCR_HOST}/${GCP_PROJECT_ID}/${params.IMAGE_NAME}:latest"
                }
            }
        }
    }
    post {
        cleanup {
            // Remove the local copies of the images to free up space
            sh 'rm -f gcp-key.json'
            sh "docker rmi ${GCR_HOST}/${GCP_PROJECT_ID}/${params.IMAGE_NAME}:${params.IMAGE_VERSION} || true"
            sh "docker rmi ${GCR_HOST}/${GCP_PROJECT_ID}/${params.IMAGE_NAME}:latest || true"
        }
    }
}
