const { defineConfig } = require('cypress');
const { allureCypress } = require('allure-cypress/reporter');

module.exports = defineConfig({
  viewportWidth: 1280,
  viewportHeight: 800,
  defaultCommandTimeout: 8000,
  requestTimeout: 10000,
  video: false,
  screenshotOnRunFailure: true,
  retries: {
    runMode: 2,
    openMode: 0,
  },
  e2e: {
    baseUrl: 'https://front.serverest.dev',
    specPattern: 'cypress/e2e/**/*.cy.js',
    supportFile: 'cypress/support/e2e.js',
    setupNodeEvents(on, config) {
      allureCypress(on, config, {
        resultsDir: 'allure-results',
      });

      return config;
    },
  },
  env: {
    apiUrl: 'https://serverest.dev',
  },
});
