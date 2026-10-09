<?php
/**
 * PHPUnit bootstrap for unit tests.
 *
 * Loads the Composer autoloader and the facet functions, which don't call
 * WordPress. No WordPress is loaded.
 */

require_once dirname( __DIR__, 2 ) . '/vendor/autoload.php';

if ( ! defined( 'ABSPATH' ) ) {
	define( 'ABSPATH', __DIR__ . '/' );
}

require_once dirname( __DIR__, 2 ) . '/inc/facets.php';
