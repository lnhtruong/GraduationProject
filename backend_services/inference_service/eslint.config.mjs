// @ts-check
import eslint from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: ['eslint.config.mjs'],
  },

  eslint.configs.recommended,
  ...tseslint.configs.recommended,

  {
    languageOptions: {
      globals: {
        ...globals.node,
      },
      parserOptions: {
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },

  {
    rules: {
      // Cho đồ án + dev nhanh
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': 'off',

      // TẮT hẳn prettier trong eslint
      'prettier/prettier': 'off',
    },
  },
);
