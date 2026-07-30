/** @type {import('eslint').Linter.Config} */
module.exports = {
  extends: ['./index.js', 'plugin:react/recommended', 'plugin:react-hooks/recommended'],
  settings: {
    react: {
      version: 'detect',
    },
  },
  env: {
    browser: true,
    es2022: true,
  },
  rules: {
    'react/react-in-jsx-scope': 'off',
  },
};
