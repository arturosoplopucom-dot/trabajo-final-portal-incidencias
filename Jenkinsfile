pipeline {
    agent any

    options {
        disableConcurrentBuilds()
        timestamps()
        timeout(time: 30, unit: 'MINUTES')
    }

    parameters {
        string(
            name: 'TAGS',
            defaultValue: '@registro',
            description: 'Tag del único escenario del trabajo final.'
        )
    }

    stages {

        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Instalar dependencias') {
            steps {
                bat 'npm ci'
            }
        }

        stage('Instalar Chromium') {
            steps {
                bat 'npx playwright install chromium'
            }
        }

        stage('Validar proyecto') {
            steps {
                bat 'npm run validate:jenkins'
            }
        }

        stage('Ejecutar pruebas') {
            steps {
                script {
                    def cucumberTags = params.TAGS?.trim() ?: '@registro'
                    bat "npm run ci -- --tags \"${cucumberTags}\""
                }
            }
        }

        stage('Generar Allure HTML') {
            steps {
                bat 'npm run allure:generate'
            }
        }
    }

    post {
        always {
            archiveArtifacts(
                artifacts: 'ejecuciones/**/*.pdf,ejecuciones/**/logs/**,ejecuciones/**/screenshots/**,allure/report/**',
                allowEmptyArchive: true,
                fingerprint: true
            )
        }
    }
}