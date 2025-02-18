import globals from 'globals';
import pluginJs from '@eslint/js';
import tsEsLint from 'typescript-eslint';

/** @type {import('eslint').Linter.Config[]} */
export default [
	{
		languageOptions: {
			globals: {
				...globals.browser,
				...globals.node,
			},
		},
	},
	pluginJs.configs.recommended,
	...tsEsLint.configs.recommended,
	{
		ignores: ['src/vite-env.d.ts'],
	},
	{
		rules: {
			'@typescript-eslint/ban-ts-comment': 'error',
			'@typescript-eslint/no-explicit-any': ['error', {ignoreRestArgs: true}],
			'@typescript-eslint/no-unused-expressions': ['error', {allowShortCircuit: true}],
			'@typescript-eslint/no-unused-vars': ['error', {
				vars: 'all',
				args: 'after-used',
				argsIgnorePattern: '^_',
				destructuredArrayIgnorePattern: '^_',
				reportUsedIgnorePattern: true,
			}],
			'array-bracket-spacing': 'error',
			'arrow-body-style': ['error', 'as-needed'],
			'brace-style': ['error', 'stroustrup', {allowSingleLine: true}],
			'comma-dangle': ['error', 'always-multiline'],
			'comma-spacing': 'error',
			'consistent-return': 0,
			'curly': ['error', 'multi-line'],
			'eol-last': 'error',
			'eqeqeq': 'error',
			'func-call-spacing': 'error',
			'indent': ['error', 'tab'],
			'keyword-spacing': 'error',
			'max-len': ['error', 110],
			'no-console': 'warn',
			'no-duplicate-imports': 'error',
			'no-multi-spaces': ['error', {ignoreEOLComments : true}],
			'no-trailing-spaces': 'error',
			'no-unused-vars': 0,
			'object-curly-spacing': 'error',
			'prefer-destructuring': 'error',
			'quotes': ['error', 'single'],
			'semi': ['error', 'always', {
				omitLastInOneLineBlock: true,
				omitLastInOneLineClassBody: true,
			}],
			'spaced-comment': 'error',
			'space-before-blocks': 'error',
			'space-before-function-paren': 'error',
			'space-in-parens': 'error',
			'space-infix-ops': 'error',
		},
	},
	{
		files: ['tests/**/*.spec.ts'],
		rules: {
			'@typescript-eslint/ban-ts-comment': 0,
		},
	},
];
