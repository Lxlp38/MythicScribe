import typescriptEslint from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import eslintPluginImport from 'eslint-plugin-import';
import eslintPluginPromise from 'eslint-plugin-promise';
import eslintPluginPrettier from 'eslint-plugin-prettier';

export default [
    {
        files: ['src/**/*.ts'],
    },

    {
        settings: {
            'import/resolver': {
                node: {
                    extensions: ['.js', '.ts', '.d.ts'],
                    moduleDirectory: ['node_modules', './'],
                },
            },
        },

        plugins: {
            '@typescript-eslint': typescriptEslint,
            import: eslintPluginImport,
            promise: eslintPluginPromise,
            prettier: eslintPluginPrettier,
        },

        languageOptions: {
            parser: tsParser,
            ecmaVersion: 2022,
            sourceType: 'module',
        },

        rules: {
            // Prettier Integration
            'prettier/prettier': 'warn',

            // TypeScript-Specific Rules
            '@typescript-eslint/no-unused-vars': [
                'warn',
                { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
            ],
            '@typescript-eslint/explicit-function-return-type': 'off',
            '@typescript-eslint/no-explicit-any': 'warn',
            '@typescript-eslint/naming-convention': [
                'warn',
                {
                    selector: 'import',
                    format: ['camelCase', 'PascalCase'],
                },
            ],
            '@typescript-eslint/no-var-requires': 'error',

            // General Best Practices
            curly: ['warn', 'all'], // Always use braces for clarity
            eqeqeq: ['warn', 'always'], // Enforce strict equality checks
            'no-throw-literal': 'warn', // Prevent throwing literals as exceptions
            semi: ['warn', 'always'], // Enforce semicolons
            'no-console': 'warn', // Discourage console usage
            'no-debugger': 'warn', // Discourage debugger usage

            // Import Rules
            'import/order': [
                'warn',
                {
                    groups: [
                        'builtin',
                        'external',
                        'internal',
                        ['parent', 'sibling', 'index'],
                    ],
                    'newlines-between': 'always',
                },
            ],
            'import/no-unresolved': [
                'error',
                {
                    ignore: ['^vscode$'],
                },
            ],
            'import/no-duplicates': 'warn',

            // Promise Rules
            'promise/always-return': 'warn',
            'promise/no-return-wrap': 'error',
            'promise/param-names': 'error',
            'promise/no-nesting': 'warn',

            // Code Consistency and Readability
            'no-trailing-spaces': 'warn', // Remove unnecessary trailing spaces
            'object-curly-spacing': ['warn', 'always'], // Enforce spacing inside braces
            'array-bracket-spacing': ['warn', 'never'], // Enforce no spaces inside array brackets
            'arrow-spacing': ['warn', { before: true, after: true }], // Enforce spacing around arrow function arrows
        },
    },
];
