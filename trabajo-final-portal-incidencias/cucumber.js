const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function resolveEnvironment() {
  const runtimePath = path.resolve(process.cwd(), '.runtime', 'current-environment.json');
  const activePath = path.resolve(process.cwd(), 'config', 'active-environment.json');
  const selection = readJson(fs.existsSync(runtimePath) ? runtimePath : activePath);
  const environmentName = selection.environment;
  const environmentPath = path.resolve(process.cwd(), 'config', 'environments', `${environmentName}.json`);
  const environment = readJson(environmentPath);
  return { name: environmentName, ...environment };
}

const environment = resolveEnvironment();

module.exports = {
  default: {
    requireModule: ['ts-node/register', 'allure-cucumberjs'],
    require: [
      'src/support/TrabajoFinalWorld.ts',
      'src/hooks/**/*.ts',
      'src/step-definitions/**/*.ts'
    ],
    format: [
      'progress-bar',
      'allure-cucumberjs/reporter',
      'json:reports/cucumber/cucumber.json'
    ],
    formatOptions: {
      resultsDir: 'allure/results',
      environmentInfo: {
        os_platform: os.platform(),
        os_release: os.release(),
        node_version: process.version,
        test_environment: environment.name,
        base_url: environment.baseUrl,
        browser: environment.browser
      },
      labels: [
        { pattern: [/@(e2e)/], name: 'layer' },
        { pattern: [/@(regresion)/], name: 'suite' }
      ]
    },
    parallel: 0,
    retry: 0,
    failFast: false,
    timeout: 120000
  }
};
