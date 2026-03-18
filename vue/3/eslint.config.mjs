// @ts-check
import pluginVue from 'eslint-plugin-vue';
import tseslint from 'typescript-eslint';
import mionPlugin from '@mionjs/devtools/eslint';

export default [
    {ignores: ['api/dist/**', 'dist/**']},
    ...pluginVue.configs['flat/recommended'],
    {
        // mion rules for backend API code
        files: ['api/**/*.ts'],
        ...mionPlugin.configs.recommended,
    },
    {
        // Disable consistent-type-imports for API code (conflicts with mion reflection)
        files: ['api/**/*.ts'],
        rules: {
            '@typescript-eslint/consistent-type-imports': 'off',
        },
    },
    {
        // Enforce type-only imports from backend in frontend code
        files: ['app/**/*.ts', 'app/**/*.vue'],
        plugins: {'@mionjs': /** @type {any} */ (mionPlugin)},
        rules: {
            '@mionjs/enforce-type-imports': [
                'error',
                {backendSources: ['api/src/']},
            ],
        },
    },
];
