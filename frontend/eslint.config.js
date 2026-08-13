import js from '@eslint/js'
import globals from 'globals'
import react from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist', 'e2e/**', 'playwright.config.js']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    plugins: { react },
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    rules: {
      'no-unused-vars': ['error', { varsIgnorePattern: '^[A-Z_]' }],
      // Sin esta regla, una variable usada SOLO en JSX (<motion.div>) se
      // reporta como "no usada" — eran 17 falsos positivos que enterraban
      // los errores reales del lint.
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      'react-hooks/static-components': 'off',
      'react-hooks/set-state-in-effect': 'off',
      'react/jsx-uses-vars': 'error',
    },
  },
])
