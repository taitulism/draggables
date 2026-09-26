import {defineConfig} from 'vitest/config';
import {playwright} from '@vitest/browser-playwright';

export default defineConfig({
	test: {
		projects: [{
			test: {
				name: 'core',
				include: ['./tests/core/**/*.spec.*'],
				environment: 'node',
			},
		}, {
			test: {
				name: 'browser',
				include: ['./tests/**/*.spec.*'],
				exclude: ['./tests/core/**'],
				browser: {
					enabled: true,
					headless: false,
					provider: playwright(),
					// providerOptions: {},
					instances: [{
						browser: 'chromium',
					}],
				},
			},
		}],
		coverage: {
			enabled: false,
			include: ['src'],
			reporter: ['text', 'html'],
		},
	},
});
