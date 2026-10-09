/**
 * Helpers for the facet definitions a context block holds, and for the
 * values item blocks store against them.
 *
 * A facet is `{ slug, label, options: [ { slug, label } ] }`. An item's
 * values are option slugs by facet slug: `{ industry: [ 'retail' ] }`.
 */

/**
 * Turns a label into a slug that isn't already taken.
 *
 * A slug is set once, when the facet or option is added, and never changes
 * with the label. Item blocks store slugs, so renaming a label leaves every
 * item's values intact.
 *
 * @param {string}   label    The label typed by the editor.
 * @param {string[]} existing Slugs already in use.
 * @return {string} A unique slug.
 */
export function createSlug( label, existing = [] ) {
	const base =
		label
			.normalize( 'NFD' )
			.replace( /[\u0300-\u036f]/g, '' )
			.toLowerCase()
			.replace( /[^a-z0-9]+/g, '-' )
			.replace( /^-+|-+$/g, '' ) || 'item';

	let slug = base;
	let suffix = 2;

	while ( existing.includes( slug ) ) {
		slug = `${ base }-${ suffix }`;
		suffix++;
	}

	return slug;
}

/**
 * Lists an item's values that point at a facet or option the context no
 * longer defines.
 *
 * @param {Object<string, string[]>} values Item values.
 * @param {Array}                    facets Facet definitions.
 * @return {Array<{facet: string, option: string}>} Orphaned values.
 */
export function getOrphans( values, facets ) {
	const orphans = [];

	Object.entries( values || {} ).forEach( ( [ facetSlug, options ] ) => {
		const facet = facets.find( ( { slug } ) => slug === facetSlug );
		const known = facet ? facet.options.map( ( { slug } ) => slug ) : [];

		( Array.isArray( options ) ? options : [] ).forEach( ( option ) => {
			if ( ! known.includes( option ) ) {
				orphans.push( { facet: facetSlug, option } );
			}
		} );
	} );

	return orphans;
}

/**
 * Removes values that point at a facet or option the context no longer
 * defines.
 *
 * @param {Object<string, string[]>} values Item values.
 * @param {Array}                    facets Facet definitions.
 * @return {Object<string, string[]>} Values with only known facets and options.
 */
export function removeOrphans( values, facets ) {
	const clean = {};

	facets.forEach( ( facet ) => {
		const stored = values?.[ facet.slug ];
		const kept = facet.options
			.map( ( { slug } ) => slug )
			.filter(
				( slug ) => Array.isArray( stored ) && stored.includes( slug )
			);

		if ( kept.length ) {
			clean[ facet.slug ] = kept;
		}
	} );

	return clean;
}

/**
 * Whether an item has a value for a facet, or for one option of it.
 *
 * @param {Object<string, string[]>} values     Item values.
 * @param {string}                   facetSlug  The facet.
 * @param {string}                   optionSlug The option. Omit to ask about the whole facet.
 * @return {boolean} Whether the item uses it.
 */
export function usesFacet( values, facetSlug, optionSlug ) {
	const stored = values?.[ facetSlug ];

	if ( ! Array.isArray( stored ) || ! stored.length ) {
		return false;
	}

	return optionSlug === undefined || stored.includes( optionSlug );
}

/**
 * Removes a facet, or one option of it, from an item's values.
 *
 * @param {Object<string, string[]>} values     Item values.
 * @param {string}                   facetSlug  The facet.
 * @param {string}                   optionSlug The option. Omit to remove the whole facet.
 * @return {Object<string, string[]>} The remaining values.
 */
export function removeFromValues( values, facetSlug, optionSlug ) {
	const { [ facetSlug ]: stored, ...rest } = values || {};

	if ( optionSlug === undefined || ! Array.isArray( stored ) ) {
		return rest;
	}

	const kept = stored.filter( ( slug ) => slug !== optionSlug );

	return kept.length ? { ...rest, [ facetSlug ]: kept } : rest;
}

/**
 * Ticks or unticks one option on an item.
 *
 * @param {Object<string, string[]>} values     Item values.
 * @param {string}                   facetSlug  The facet.
 * @param {string}                   optionSlug The option.
 * @param {boolean}                  isChecked  Whether the option is now ticked.
 * @return {Object<string, string[]>} The new values.
 */
export function toggleValue( values, facetSlug, optionSlug, isChecked ) {
	const without = removeFromValues( values, facetSlug, optionSlug );

	if ( ! isChecked ) {
		return without;
	}

	return {
		...without,
		[ facetSlug ]: [ ...( without[ facetSlug ] || [] ), optionSlug ],
	};
}
