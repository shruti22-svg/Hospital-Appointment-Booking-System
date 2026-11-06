pipeline {
    agent any

    options {
        timestamps()
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Install backend') {
            steps {
                dir('backend') {
                    sh 'npm ci'
                }
            }
        }

        stage('API tests TC01-TC10') {
            steps {
                dir('backend') {
                    sh 'npm test'
                }
            }
        }

        stage('Docker build') {
            steps {
                sh 'docker build -t hospital-appointment-booking:ci .'
            }
        }

        stage('Selenium tests') {
            steps {
                sh 'docker compose -f docker-compose.ci.yml up --build --abort-on-container-exit --exit-code-from tests'
            }
        }
    }

    post {
        always {
            sh 'docker compose -f docker-compose.ci.yml down -v || true'
        }
    }
}
