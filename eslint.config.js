const js = require('@eslint/js');
const cypressPlugin = require('eslint-plugin-cypress');
const prettierConfig = require('eslint-config-prettier');
const globals = require('globals');

module.exports = [
  {
    ignores: [
      'node_modules/**',
      'cypress/videos/**',
      'cypress/screenshots/**',
      'cypress/downloads/**',
    ],
  },
  js.configs.recommended,
  {
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'commonjs',
      globals: {
        ...globals.node,
      },
    },
  },
  {
    ...cypressPlugin.configs.recommended,
    files: ['cypress/**/*.js'],
    languageOptions: {
      ...cypressPlugin.configs.recommended.languageOptions,
      ecmaVersion: 2022,
      sourceType: 'module',
    },
  },
  {
    files: ['cypress/**/*.js'],
    rules: {
      'no-unused-expressions': 'off',
    },
  },
  prettierConfig,
];
