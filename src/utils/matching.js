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
