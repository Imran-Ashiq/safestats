// eslint.config.js

import tseslint from 'typescript-eslint';
import prettierConfig from 'eslint-config-prettier';

export default tseslint.config(
  // This is the new way to ignore files
  {
    ignores: ['dist', 'node_modules'],
  },
  // This applies TypeScript-ESLint's recommended rules
  ...tseslint.configs.recommended,
  // This must be the LAST item in the array. It turns off any style rules
  // that might conflict with Prettier.
  prettierConfig
);