<?php
/**
 * Block registration and rendering.
 *
 * @package HM\FacetBlocks
 */

namespace HM\FacetBlocks;

use WP_Block;

/**
 * Interactivity API store namespace, shared with src/context/view.js.
 */
const STORE = 'hm-facet-blocks';

/**
 * Block context key the context block provides its facets under.
 */
const FACETS_CONTEXT = 'hm-facet-blocks/facets';

add_action( 'init', __NAMESPACE__ . '\\register_blocks' );

/**
 * Registers the blocks from the build directory.
 */
function register_blocks(): void {
	$blocks = [
		'context'    => 'render_context',
		'control'    => 'render_control',
		'item'       => 'render_item',
		'no-results' => 'render_no_results',
	];

	foreach ( $blocks as $directory => $callback ) {
		register_block_type_from_metadata(
			HM_FACET_BLOCKS_PATH . 'build/' . $directory,
			[ 'render_callback' => __NAMESPACE__ . '\\' . $callback ]
		);
	}
}

/**
 * The selection for the current request.
 *
 * @param array $facets Facets from sanitize_facets().
 * @return array<string, string>
 */
function get_request_selection( array $facets ): array {
	// phpcs:ignore WordPress.Security.NonceVerification.Recommended -- Read-only filter state, checked against the defined options.
	return get_selected( $facets, $_GET );
}

/**
 * The facets a block inherits from its context block.
 *
 * @param WP_Block $block The block being rendered.
 * @return array
 */
function get_context_facets( WP_Block $block ): array {
	return sanitize_facets( $block->context[ FACETS_CONTEXT ] ?? [] );
}

/**
 * Registers the derived state the directives read, so the first response is
 * already filtered. src/context/view.js defines the same getters for the
 * browser.
 */
function register_state(): void {
	static $registered = false;

	if ( $registered ) {
		return;
	}

	$registered = true;

	wp_interactivity_state(
		STORE,
		[
			'isItemHidden'     => function (): bool {
				$context = wp_interactivity_get_context();

				return ! item_matches( $context['item'] ?? [], $context['selected'] ?? [] );
			},
			'isOptionSelected' => function (): bool {
				$context = wp_interactivity_get_context();

				return ( $context['selected'][ $context['facet'] ?? '' ] ?? '' ) === ( $context['option'] ?? '' );
			},
			'hasResults'       => function (): bool {
				$context = wp_interactivity_get_context();

				return has_results( $context['items'] ?? [], $context['selected'] ?? [] );
			},
		]
	);
}

/**
 * Renders the context block: the interactive region that holds the
 * selection and the values of every item inside it.
 *
 * @param array    $attributes Block attributes.
 * @param string   $content    Rendered inner blocks.
 * @param WP_Block $block      Block instance.
 * @return string
 */
function render_context( array $attributes, string $content, WP_Block $block ): string {
	$facets = sanitize_facets( $attributes['facets'] ?? [] );

	register_state();

	return sprintf(
		'<div %1$s %2$s>%3$s</div>',
		get_block_wrapper_attributes( [ 'data-wp-interactive' => STORE ] ),
		wp_interactivity_data_wp_context(
			[
				// Cast so a context with no facets still encodes as an object.
				'selected' => (object) get_request_selection( $facets ),
				'items'    => array_map(
					fn ( array $values ): object => (object) $values,
					collect_items( $block->parsed_block['innerBlocks'] ?? [], $facets )
				),
			]
		),
		$content
	);
}

/**
 * Renders an item, hidden when it doesn't match the current selection.
 *
 * @param array    $attributes Block attributes.
 * @param string   $content    Rendered inner blocks.
 * @param WP_Block $block      Block instance.
 * @return string
 */
function render_item( array $attributes, string $content, WP_Block $block ): string {
	$facets = get_context_facets( $block );
	$values = clean_item_values( $attributes['values'] ?? [], $facets );

	return sprintf(
		'<div %1$s %2$s%3$s>%4$s</div>',
		get_block_wrapper_attributes( [ 'data-wp-bind--hidden' => 'state.isItemHidden' ] ),
		wp_interactivity_data_wp_context( [ 'item' => (object) $values ] ),
		item_matches( $values, get_request_selection( $facets ) ) ? '' : ' hidden',
		$content
	);
}

/**
 * Renders the no results block, shown while no item matches.
 *
 * It starts hidden. The item list lives on the context block, which renders
 * after this one, so the `hidden` directive decides whether it shows when
 * WordPress processes the context block's directives.
 *
 * @param array  $attributes Block attributes.
 * @param string $content    Rendered inner blocks.
 * @return string
 */
function render_no_results( array $attributes, string $content ): string {
	return sprintf(
		'<div %1$s hidden>%2$s</div>',
		get_block_wrapper_attributes(
			[
				'role'                 => 'status',
				'data-wp-bind--hidden' => 'state.hasResults',
			]
		),
		$content
	);
}

/**
 * Renders a control: one button per option, or a select.
 *
 * Renders nothing when the facet it points at no longer exists.
 *
 * @param array    $attributes Block attributes.
 * @param string   $content    Unused, the block has no inner content.
 * @param WP_Block $block      Block instance.
 * @return string
 */
function render_control( array $attributes, string $content, WP_Block $block ): string {
	$facets = get_context_facets( $block );
	$facet  = find_facet( $facets, (string) ( $attributes['facet'] ?? '' ) );

	if ( $facet === null ) {
		return '';
	}

	$selected    = get_request_selection( $facets )[ $facet['slug'] ];
	$is_select   = ( $attributes['display'] ?? 'buttons' ) === 'select';
	$all_label   = (string) ( $attributes['allLabel'] ?? '' );
	$all_label   = $all_label !== '' ? $all_label : __( 'All', 'hm-facet-blocks' );
	$id          = wp_unique_id( 'hm-facet-control-' );
	$label_class = 'wp-block-hm-facet-blocks-control__label';

	if ( empty( $attributes['showLabel'] ) ) {
		$label_class .= ' screen-reader-text';
	}

	$options = array_merge(
		[
			[
				'slug'  => '',
				'label' => $all_label,
			],
		],
		$facet['options']
	);

	$wrapper_context = wp_interactivity_data_wp_context( [ 'facet' => $facet['slug'] ] );

	if ( $is_select ) {
		$options_html = '';

		foreach ( $options as $option ) {
			$options_html .= sprintf(
				'<option value="%1$s" %2$s data-wp-bind--selected="state.isOptionSelected"%3$s>%4$s</option>',
				esc_attr( $option['slug'] ),
				wp_interactivity_data_wp_context( [ 'option' => $option['slug'] ] ),
				selected( $selected, $option['slug'], false ),
				esc_html( $option['label'] )
			);
		}

		return sprintf(
			'<div %1$s %2$s><label class="%3$s" for="%4$s">%5$s</label><select class="wp-block-hm-facet-blocks-control__select" id="%4$s" data-wp-on--change="actions.selectFromChange">%6$s</select></div>',
			get_block_wrapper_attributes( [ 'class' => 'is-display-select' ] ),
			$wrapper_context,
			esc_attr( $label_class ),
			esc_attr( $id ),
			esc_html( $facet['label'] ),
			$options_html
		);
	}

	$buttons_html = '';

	foreach ( $options as $option ) {
		$buttons_html .= sprintf(
			'<button type="button" class="wp-block-hm-facet-blocks-control__option" %1$s data-wp-on--click="actions.select" data-wp-bind--aria-pressed="state.isOptionSelected" aria-pressed="%2$s">%3$s</button>',
			wp_interactivity_data_wp_context( [ 'option' => $option['slug'] ] ),
			$selected === $option['slug'] ? 'true' : 'false',
			esc_html( $option['label'] )
		);
	}

	return sprintf(
		'<div %1$s %2$s><span class="%3$s" id="%4$s">%5$s</span><div class="wp-block-hm-facet-blocks-control__options">%6$s</div></div>',
		get_block_wrapper_attributes(
			[
				'class'           => 'is-display-buttons',
				'role'            => 'group',
				'aria-labelledby' => $id,
			]
		),
		$wrapper_context,
		esc_attr( $label_class ),
		esc_attr( $id ),
		esc_html( $facet['label'] ),
		$buttons_html
	);
}
