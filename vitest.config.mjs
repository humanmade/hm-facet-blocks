import { defineConfig } from 'vitest/config';

export default defineConfig( {
	test: {
		// Keeps Vitest away from the Playwright specs in tests/e2e.
		include: [ 'src/**/*.test.js' ],
	},
} );
