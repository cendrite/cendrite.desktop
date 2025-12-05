// eslint.config.mts / eslint.config.mjs

import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';
import { defineConfig } from 'eslint/config';

export default defineConfig(
    // global ignores
    {
        ignores: ['dist', 'dist-electron'],
    },

    // core JS recommended rules
    js.configs.recommended,

    // typescript-eslint recommended rules (parser + plugin etc.)
    ...tseslint.configs.recommended,

    // your project-specific overrides
    {
        files: ['**/*.{ts,tsx}'],
        languageOptions: {
            ecmaVersion: 2020,
            globals: globals.browser,
            // parser + TS bits already come from tseslint.configs.recommended
        },
        plugins: {
            'react-hooks': reactHooks,
            'react-refresh': reactRefresh,
        },
        rules: {
            ...reactHooks.configs.recommended.rules,
            'react-refresh/only-export-components': 'off',
            '@typescript-eslint/no-unused-vars': 'off',
            '@typescript-eslint/no-explicit-any': 'off',
        },
    },
);
;
