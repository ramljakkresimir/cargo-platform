// @ts-check
import eslint from '@eslint/js';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: ['eslint.config.mjs'],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  eslintPluginPrettierRecommended,
  {
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.jest,
      },
      sourceType: 'commonjs',
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-floating-promises': 'warn',
      '@typescript-eslint/no-unsafe-argument': 'warn',
      // Allow `import x = require('pkg')` — needed for CJS packages (e.g. supertest)
      // whose "export =" typings don't interop with a plain `import x from 'pkg'`
      // under this project's commonjs module setting (see test/app.e2e-spec.ts).
      '@typescript-eslint/no-require-imports': ['error', { allowAsImport: true }],
      "prettier/prettier": ["error", { endOfLine: "auto" }],
    },
  },
);
