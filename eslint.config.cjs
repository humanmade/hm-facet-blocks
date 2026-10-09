const defaultConfig = require( '@wordpress/scripts/config/eslint.config.cjs' );

module.exports = [
	...defaultConfig,
	{
		ignores: [ 'playwright-report/**', 'test-results/**' ],
	},
	{
		rules: {
			// WordPress provides the @wordpress packages at runtime and
			// wp-scripts leaves them out of the bundle, so they are not
			// installed here.
			'import/no-unresolved': [ 'error', { ignore: [ '^@wordpress/' ] } ],
			'import/no-extraneous-dependencies': 'off',
		},
	},
];
