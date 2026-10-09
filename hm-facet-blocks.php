<?php
/**
 * Plugin Name:       HM Facet Blocks
 * Plugin URI:        https://github.com/humanmade/hm-facet-blocks
 * Description:       Blocks for filtering content already on the page by facets, such as a card grid filtered by industry.
 * Version:           __VERSION__
 * Requires at least: 6.9
 * Requires PHP:      8.2
 * Author:            Human Made
 * Author URI:        https://humanmade.com
 * License:           GPL-2.0-or-later
 * License URI:       https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain:       hm-facet-blocks
 *
 * @package HM\FacetBlocks
 */

namespace HM\FacetBlocks;

// Exit if accessed directly.
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

define( 'HM_FACET_BLOCKS_VERSION', '__VERSION__' );
define( 'HM_FACET_BLOCKS_PATH', plugin_dir_path( __FILE__ ) );

require_once HM_FACET_BLOCKS_PATH . 'inc/facets.php';
require_once HM_FACET_BLOCKS_PATH . 'inc/blocks.php';
