import {defineConfig} from 'vitest/config';

export default defineConfig({
	test: {
		include: ['./tests/**/*.spec.*'],
		browser: {
			enabled: true,
			headless: false,
			provider: 'playwright',
			// providerOptions: {},
			instances: [{
				browser: 'chromium',
			}],
		},
		coverage: {
			enabled: false,
			include: ['src'],
			reporter: ['text', 'html'],
		},
	},
});
