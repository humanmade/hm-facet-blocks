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

/**
 * Block context key an item's position among its context block's items is
 * passed under. See number_items().
 */
const INDEX_CONTEXT = 'hm-facet-blocks/index';

add_action( 'init', __NAMESPACE__ . '\\register_blocks' );
add_filter( 'render_block_context', __NAMESPACE__ . '\\number_items', 10, 2 );

/**
 * Registers the blocks from the build directory.
 */
function register_blocks(): void {
	$blocks = [
		'context'    => 'render_context',
		'control'    => 'render_control',
		'item'       => 'render_item',
		'no-results' => 'render_no_results',
		'show-more'  => 'render_show_more',
		'selection'  => 'render_selection',
		'clear'      => 'render_clear',
	];

	foreach ( $blocks as $directory => $callback ) {
		register_block_type_from_metadata(
			HM_FACET_BLOCKS_PATH . 'build/' . $directory,
			[ 'render_callback' => __NAMESPACE__ . '\\' . $callback ]
		);
	}
}

/**
 * How many items each context block being rendered has numbered so far, with
 * the innermost context block last.
 *
 * @return int[]
 */
function &item_counters(): array {
	static $counters = [];

	return $counters;
}

/**
 * Gives each item its position among the items of its context block, which
 * the limit needs to count the matching items before it.
 *
 * WordPress runs this filter for each block just before rendering it, in page
 * order. A context block starts a count that render_context() ends, so the
 * items of a nested context block are counted separately.
 *
 * @param array $context      Block context.
 * @param array $parsed_block The block about to render.
 * @return array
 */
function number_items( $context, $parsed_block ) {
	$counters = &item_counters();
	$name     = $parsed_block['blockName'] ?? null;

	if ( $name === CONTEXT_BLOCK ) {
		$counters[] = 0;
	} elseif ( $name === ITEM_BLOCK && $counters !== [] ) {
		$context[ INDEX_CONTEXT ] = $counters[ array_key_last( $counters ) ]++;
	}

	return $context;
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
				$context  = wp_interactivity_get_context();
				$selected = $context['selected'] ?? [];

				return ! item_matches( $context['item'] ?? [], $selected )
					|| ! is_within_limit( $context['items'] ?? [], $context['index'] ?? 0, $selected, $context['shown'] ?? 0 );
			},
			'isOptionSelected' => function (): bool {
				$context = wp_interactivity_get_context();

				return ( $context['selected'][ $context['facet'] ?? '' ] ?? '' ) === ( $context['option'] ?? '' );
			},
			'hasResults'       => function (): bool {
				$context = wp_interactivity_get_context();

				return has_results( $context['items'] ?? [], $context['selected'] ?? [] );
			},
			'hasMore'          => function (): bool {
				$context = wp_interactivity_get_context();

				return has_more( $context['items'] ?? [], $context['selected'] ?? [], $context['shown'] ?? 0 );
			},
			'hasSelection'     => function (): bool {
				$context = wp_interactivity_get_context();

				return has_selection( $context['selected'] ?? [] );
			},
			'isFacetSelected'  => function (): bool {
				$context = wp_interactivity_get_context();

				return ( $context['selected'][ $context['facet'] ?? '' ] ?? '' ) !== '';
			},
			'selectedLabel'    => function (): string {
				$context = wp_interactivity_get_context();
				$option  = $context['selected'][ $context['facet'] ?? '' ] ?? '';

				return (string) ( $context['labels'][ $option ] ?? '' );
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
	$limit  = max( 0, (int) ( $attributes['limit'] ?? 0 ) );

	// Ends the count number_items() started for this block.
	array_pop( item_counters() );

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
				'limit'    => $limit,
				// How many matching items show. The show more button raises it.
				'shown'    => $limit,
			]
		),
		$content
	);
}

/**
 * Renders an item, hidden when it doesn't match the current selection.
 *
 * The `hidden` directive also hides it when it is past its context block's
 * limit, which depends on the items before it.
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
		wp_interactivity_data_wp_context(
			[
				'item'  => (object) $values,
				'index' => (int) ( $block->context[ INDEX_CONTEXT ] ?? 0 ),
			]
		),
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
 * Renders the show more button, shown while matching items are past the
 * context block's limit.
 *
 * It starts hidden for the same reason the no results block does.
 *
 * @param array $attributes Block attributes.
 * @return string
 */
function render_show_more( array $attributes ): string {
	$label = (string) ( $attributes['label'] ?? '' );
	$label = $label !== '' ? $label : __( 'Show more', 'hm-facet-blocks' );

	return sprintf(
		'<div %1$s hidden><button type="button" class="wp-block-hm-facet-blocks-show-more__button wp-element-button" data-wp-on--click="actions.showMore">%2$s</button></div>',
		get_block_wrapper_attributes( [ 'data-wp-bind--hidden' => '!state.hasMore' ] ),
		esc_html( $label )
	);
}

/**
 * Renders the selection block: one button per facet, showing the facet's
 * selected option and removing it when pressed.
 *
 * A button is rendered for every facet and hidden while its facet is on all,
 * so choosing an option in the browser has a button to show.
 *
 * @param array    $attributes Block attributes.
 * @param string   $content    Unused, the block has no inner content.
 * @param WP_Block $block      Block instance.
 * @return string
 */
function render_selection( array $attributes, string $content, WP_Block $block ): string {
	$facets   = get_context_facets( $block );
	$selected = get_request_selection( $facets );
	$buttons  = '';

	foreach ( $facets as $facet ) {
		$labels = array_column( $facet['options'], 'label', 'slug' );
		$option = $selected[ $facet['slug'] ];

		$buttons .= sprintf(
			'<button type="button" class="wp-block-hm-facet-blocks-selection__option" %1$s data-wp-on--click="actions.clearFacet" data-wp-bind--hidden="!state.isFacetSelected"%2$s><span class="screen-reader-text">%3$s </span><span data-wp-text="state.selectedLabel">%4$s</span></button>',
			wp_interactivity_data_wp_context(
				[
					'facet'  => $facet['slug'],
					// Cast so a facet with no options still encodes as an object.
					'labels' => (object) $labels,
				]
			),
			$option === '' ? ' hidden' : '',
			esc_html(
				sprintf(
					/* translators: %s: facet name, such as "Industry". The selected option follows it. */
					__( 'Remove %s filter:', 'hm-facet-blocks' ),
					$facet['label']
				)
			),
			esc_html( $labels[ $option ] ?? '' )
		);
	}

	return sprintf(
		'<div %1$s%2$s>%3$s</div>',
		get_block_wrapper_attributes(
			[
				'role'                 => 'group',
				'aria-label'           => __( 'Selected filters', 'hm-facet-blocks' ),
				'data-wp-bind--hidden' => '!state.hasSelection',
			]
		),
		has_selection( $selected ) ? '' : ' hidden',
		$buttons
	);
}

/**
 * Renders the clear button, shown while any facet has an option selected.
 *
 * @param array    $attributes Block attributes.
 * @param string   $content    Unused, the block has no inner content.
 * @param WP_Block $block      Block instance.
 * @return string
 */
function render_clear( array $attributes, string $content, WP_Block $block ): string {
	$label = (string) ( $attributes['label'] ?? '' );
	$label = $label !== '' ? $label : __( 'Clear all filters', 'hm-facet-blocks' );

	return sprintf(
		'<div %1$s%2$s><button type="button" class="wp-block-hm-facet-blocks-clear__button" data-wp-on--click="actions.clearAll">%3$s</button></div>',
		get_block_wrapper_attributes( [ 'data-wp-bind--hidden' => '!state.hasSelection' ] ),
		has_selection( get_request_selection( get_context_facets( $block ) ) ) ? '' : ' hidden',
		esc_html( $label )
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
