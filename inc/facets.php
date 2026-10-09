<?php
/**
 * Facet data: reading the definitions a context block holds, and matching
 * items against a selection.
 *
 * Nothing here calls WordPress, so it can be unit tested without it.
 *
 * @package HM\FacetBlocks
 */

namespace HM\FacetBlocks;

/**
 * Prefix for the URL parameter that carries a facet's selected option, so a
 * facet slug such as "name" or "author" can't collide with a WordPress query
 * var.
 */
const QUERY_PREFIX = 'facet-';

/**
 * Block name of the context block.
 */
const CONTEXT_BLOCK = 'hm-facet-blocks/context';

/**
 * Block name of the item block.
 */
const ITEM_BLOCK = 'hm-facet-blocks/item';

/**
 * Drops anything from a context block's `facets` attribute that isn't a
 * usable facet or option.
 *
 * @param mixed $facets The raw attribute value.
 * @return array<int, array{slug: string, label: string, options: array<int, array{slug: string, label: string}>}>
 */
function sanitize_facets( $facets ): array {
	if ( ! is_array( $facets ) ) {
		return [];
	}

	$clean = [];
	$seen  = [];

	foreach ( $facets as $facet ) {
		if ( ! is_valid_entry( $facet ) || isset( $seen[ $facet['slug'] ] ) ) {
			continue;
		}

		$options      = [];
		$seen_options = [];
		$raw_options  = is_array( $facet['options'] ?? null ) ? $facet['options'] : [];

		foreach ( $raw_options as $option ) {
			if ( ! is_valid_entry( $option ) || isset( $seen_options[ $option['slug'] ] ) ) {
				continue;
			}

			$seen_options[ $option['slug'] ] = true;
			$options[]                       = [
				'slug'  => $option['slug'],
				'label' => entry_label( $option ),
			];
		}

		$seen[ $facet['slug'] ] = true;
		$clean[]                = [
			'slug'    => $facet['slug'],
			'label'   => entry_label( $facet ),
			'options' => $options,
		];
	}

	return $clean;
}

/**
 * Whether a facet or option has a usable slug.
 *
 * @param mixed $entry A facet or option.
 * @return bool
 */
function is_valid_entry( $entry ): bool {
	return is_array( $entry ) && is_string( $entry['slug'] ?? null ) && $entry['slug'] !== '';
}

/**
 * The label of a facet or option, falling back to its slug.
 *
 * @param array $entry A facet or option that passed is_valid_entry().
 * @return string
 */
function entry_label( array $entry ): string {
	$label = $entry['label'] ?? '';

	return is_string( $label ) && $label !== '' ? $label : $entry['slug'];
}

/**
 * Finds a facet by slug.
 *
 * @param array  $facets Facets from sanitize_facets().
 * @param string $slug   The facet slug.
 * @return array|null
 */
function find_facet( array $facets, string $slug ): ?array {
	foreach ( $facets as $facet ) {
		if ( $facet['slug'] === $slug ) {
			return $facet;
		}
	}

	return null;
}

/**
 * Reduces an item's stored values to the facets and options its context
 * still defines.
 *
 * A value for a facet or option that has since been removed is ignored, so
 * the item behaves as if that value had never been set. The stored attribute
 * is left alone: the editor offers the clean-up.
 *
 * @param mixed $values The item's raw `values` attribute.
 * @param array $facets Facets from sanitize_facets().
 * @return array<string, string[]> Option slugs by facet slug, with a key for every facet.
 */
function clean_item_values( $values, array $facets ): array {
	$values = is_array( $values ) ? $values : [];
	$clean  = [];

	foreach ( $facets as $facet ) {
		$stored = $values[ $facet['slug'] ] ?? [];
		$stored = is_array( $stored ) ? $stored : [];
		$known  = array_column( $facet['options'], 'slug' );

		$clean[ $facet['slug'] ] = array_values( array_intersect( $known, $stored ) );
	}

	return $clean;
}

/**
 * Reads the selected option for each facet from URL parameters.
 *
 * @param array $facets Facets from sanitize_facets().
 * @param array $query  URL parameters, such as $_GET.
 * @return array<string, string> Selected option slug by facet slug. An empty string means all.
 */
function get_selected( array $facets, array $query ): array {
	$selected = [];

	foreach ( $facets as $facet ) {
		$value = $query[ QUERY_PREFIX . $facet['slug'] ] ?? '';
		$known = array_column( $facet['options'], 'slug' );

		$selected[ $facet['slug'] ] = is_string( $value ) && in_array( $value, $known, true ) ? $value : '';
	}

	return $selected;
}

/**
 * Whether an item should show for a selection.
 *
 * Every facet with a selected option has to match, and an item matches a
 * facet when the selected option is one of its values. An item with no value
 * for a facet therefore only shows while that facet is on all.
 *
 * @param array $values   Item values from clean_item_values().
 * @param array $selected Selection from get_selected().
 * @return bool
 */
function item_matches( array $values, array $selected ): bool {
	foreach ( $selected as $facet => $option ) {
		if ( $option === '' ) {
			continue;
		}

		if ( ! in_array( $option, $values[ $facet ] ?? [], true ) ) {
			return false;
		}
	}

	return true;
}

/**
 * Collects the values of every item block inside a context block.
 *
 * Stops at a nested context block, whose items belong to it.
 *
 * @param array $inner_blocks Parsed inner blocks.
 * @param array $facets       Facets from sanitize_facets().
 * @return array<int, array<string, string[]>>
 */
function collect_items( array $inner_blocks, array $facets ): array {
	$items = [];

	foreach ( $inner_blocks as $inner_block ) {
		$name = $inner_block['blockName'] ?? null;

		if ( $name === CONTEXT_BLOCK ) {
			continue;
		}

		if ( $name === ITEM_BLOCK ) {
			$items[] = clean_item_values( $inner_block['attrs']['values'] ?? [], $facets );
		}

		array_push( $items, ...collect_items( $inner_block['innerBlocks'] ?? [], $facets ) );
	}

	return $items;
}

/**
 * Whether any item shows for a selection.
 *
 * @param array $items    Items from collect_items().
 * @param array $selected Selection from get_selected().
 * @return bool
 */
function has_results( array $items, array $selected ): bool {
	foreach ( $items as $values ) {
		if ( item_matches( $values, $selected ) ) {
			return true;
		}
	}

	return false;
}

/**
 * Whether an item is among the first matching items a context shows.
 *
 * Counts the matching items before it, in page order. Mirrors
 * isWithinLimit() in src/utils/matching.js.
 *
 * @param array $items    Items from collect_items().
 * @param int   $index    The item's position in $items.
 * @param array $selected Selection from get_selected().
 * @param int   $shown    How many matching items show. Zero shows them all.
 * @return bool
 */
function is_within_limit( array $items, int $index, array $selected, int $shown ): bool {
	if ( $shown <= 0 ) {
		return true;
	}

	$before = array_filter(
		array_slice( $items, 0, $index ),
		fn ( array $values ): bool => item_matches( $values, $selected )
	);

	return count( $before ) < $shown;
}

/**
 * Whether matching items are left that a context isn't showing yet.
 *
 * @param array $items    Items from collect_items().
 * @param array $selected Selection from get_selected().
 * @param int   $shown    How many matching items show. Zero shows them all.
 * @return bool
 */
function has_more( array $items, array $selected, int $shown ): bool {
	if ( $shown <= 0 ) {
		return false;
	}

	$matching = array_filter(
		$items,
		fn ( array $values ): bool => item_matches( $values, $selected )
	);

	return count( $matching ) > $shown;
}
