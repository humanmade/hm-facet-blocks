/**
 * Whether an item should show for a selection.
 *
 * Every facet with a selected option has to match, and an item matches a
 * facet when the selected option is one of its values. Mirrors
 * item_matches() in inc/facets.php.
 *
 * @param {Object<string, string[]>} values   Option slugs by facet slug.
 * @param {Object<string, string>}   selected Selected option slug by facet slug. An empty string means all.
 * @return {boolean} Whether the item shows.
 */
export function itemMatches( values, selected ) {
	return Object.entries( selected || {} ).every(
		( [ facet, option ] ) =>
			! option || ( values?.[ facet ] || [] ).includes( option )
	);
}

/**
 * Whether any item shows for a selection.
 *
 * @param {Array<Object<string, string[]>>} items    Values of every item.
 * @param {Object<string, string>}          selected Selected option slug by facet slug.
 * @return {boolean} Whether at least one item shows.
 */
export function hasResults( items, selected ) {
	return ( items || [] ).some( ( values ) =>
		itemMatches( values, selected )
	);
}

/**
 * Whether any facet has an option selected.
 *
 * Mirrors has_selection() in inc/facets.php.
 *
 * @param {Object<string, string>} selected Selected option slug by facet slug. An empty string means all.
 * @return {boolean} Whether at least one facet is not on all.
 */
export function hasSelection( selected ) {
	return Object.values( selected || {} ).some( Boolean );
}

/**
 * Whether an item is among the first matching items a context shows.
 *
 * Counts the matching items before it, in page order. Mirrors
 * is_within_limit() in inc/facets.php.
 *
 * @param {Array<Object<string, string[]>>} items    Values of every item.
 * @param {number}                          index    The item's position in `items`.
 * @param {Object<string, string>}          selected Selected option slug by facet slug.
 * @param {number}                          shown    How many matching items show. Zero shows them all.
 * @return {boolean} Whether the item is within the limit.
 */
export function isWithinLimit( items, index, selected, shown ) {
	if ( ! ( shown > 0 ) ) {
		return true;
	}

	const before = ( items || [] )
		.slice( 0, index )
		.filter( ( values ) => itemMatches( values, selected ) );

	return before.length < shown;
}

/**
 * Whether matching items are left that a context isn't showing yet.
 *
 * @param {Array<Object<string, string[]>>} items    Values of every item.
 * @param {Object<string, string>}          selected Selected option slug by facet slug.
 * @param {number}                          shown    How many matching items show. Zero shows them all.
 * @return {boolean} Whether more items can be shown.
 */
export function hasMore( items, selected, shown ) {
	if ( ! ( shown > 0 ) ) {
		return false;
	}

	const matching = ( items || [] ).filter( ( values ) =>
		itemMatches( values, selected )
	);

	return matching.length > shown;
}

/**
 * The position in `items` of the matching item at a position among the
 * matching items.
 *
 * @param {Array<Object<string, string[]>>} items    Values of every item.
 * @param {Object<string, string>}          selected Selected option slug by facet slug.
 * @param {number}                          rank     Position among the matching items, from zero.
 * @return {number} The position in `items`, or -1 when fewer items match.
 */
export function indexAtRank( items, selected, rank ) {
	let seen = 0;

	return ( items || [] ).findIndex(
		( values ) => itemMatches( values, selected ) && seen++ === rank
	);
}
