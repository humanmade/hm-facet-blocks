import { getContext, store } from '@wordpress/interactivity';

import { hasResults, itemMatches } from '../utils/matching';

// Matches QUERY_PREFIX in inc/facets.php.
const QUERY_PREFIX = 'facet-';

/**
 * Writes the selection to the URL, so a filtered view can be linked to and
 * the server renders it filtered.
 *
 * @param {Object<string, string>} selected Selected option slug by facet slug.
 */
function syncUrl( selected ) {
	const url = new URL( window.location.href );

	Object.entries( selected ).forEach( ( [ facet, option ] ) => {
		if ( option ) {
			url.searchParams.set( QUERY_PREFIX + facet, option );
		} else {
			url.searchParams.delete( QUERY_PREFIX + facet );
		}
	} );

	window.history.replaceState( window.history.state, '', url );
}

/**
 * Selects an option of the facet the current control drives.
 *
 * @param {string} option The option slug. An empty string means all.
 */
function select( option ) {
	const context = getContext();

	context.selected[ context.facet ] = option;
	syncUrl( context.selected );
}

// The derived state here has the same names as the closures in
// register_state() in inc/blocks.php, which give the server-rendered values.
store( 'hm-facet-blocks', {
	state: {
		get isItemHidden() {
			const { item, selected } = getContext();

			return ! itemMatches( item, selected );
		},
		get isOptionSelected() {
			const { facet, option, selected } = getContext();

			return ( selected[ facet ] || '' ) === option;
		},
		get hasResults() {
			const { items, selected } = getContext();

			return hasResults( items, selected );
		},
	},
	actions: {
		select() {
			select( getContext().option );
		},
		selectFromChange( event ) {
			select( event.target.value );
		},
	},
} );
