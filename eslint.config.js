import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';
import { defineConfig } from 'eslint/config';

export default defineConfig(
    {
        ignores: ['dist', 'dist-electron'],
    },
    js.configs.recommended,
    ...tseslint.configs.recommended,
    {
        files: ['**/*.{ts,tsx}'],
        languageOptions: {
            ecmaVersion: 2020,
            globals: globals.browser,
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
    // Process boundary: renderer <-> main talk only through src/Shared.
    {
        files: ['src/React/**/*.{ts,tsx}'],
        rules: {
            'no-restricted-imports': [
                'error',
                {
                    patterns: [
                        {
                            group: ['**/Electron/**'],
                            message: 'The renderer must not import main-process code. Put shared contracts in src/Shared/Contracts.',
                        },
                    ],
                },
            ],
        },
    },
    {
        files: ['src/Electron/**/*.{ts,cts}'],
        rules: {
            'no-restricted-imports': [
                'error',
                {
                    patterns: [
                        {
                            group: ['**/React/**'],
                            message: 'The main process must not import renderer code. Put shared contracts in src/Shared/Contracts.',
                        },
                    ],
                },
            ],
        },
    },
    {
        files: ['src/Shared/**/*.ts'],
        rules: {
            'no-restricted-imports': [
                'error',
                {
                    patterns: [
                        {
                            group: ['**/Electron/**', '**/React/**'],
                            message: 'src/Shared is the dependency-free kernel; it must not import from either process.',
                        },
                    ],
                },
            ],
        },
    },
);
;
