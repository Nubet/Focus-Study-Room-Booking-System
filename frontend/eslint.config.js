import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
    },
    rules: {
      'sort-imports': ['error', { ignoreDeclarationSort: true, ignoreCase: true }],
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@/app/*'],
              message: 'App layer is top-level and should not be imported in lower layers.'
            }
          ]
        }
      ]
    }
  },
  {
    files: ['src/pages/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@/app/*'],
              message: 'Pages cannot import app layer.'
            }
          ]
        }
      ]
    }
  },
  {
    files: ['src/main.tsx'],
    rules: {
      'no-restricted-imports': 'off'
    }
  },
  {
    files: ['src/features/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@/app/*', '@/pages/*'],
              message: 'Features can depend only on entities/shared/data and feature-local modules.'
            }
          ]
        }
      ]
    }
  },
  {
    files: ['src/entities/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@/app/*', '@/pages/*', '@/features/*'],
              message: 'Entities must stay independent from app/pages/features.'
            }
          ]
        }
      ]
    }
  },
  {
    files: ['src/shared/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@/app/*', '@/pages/*', '@/features/*', '@/entities/*'],
              message: 'Shared must remain framework/infrastructure-level and not depend on domain/application layers.'
            }
          ]
        }
      ]
    }
  },
])
