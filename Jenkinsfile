pipeline {
    agent any

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('API tests in Docker') {
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
