import { getContext, getElement, store } from '@wordpress/interactivity';

import {
	hasMore,
	hasResults,
	indexAtRank,
	isWithinLimit,
	itemMatches,
} from '../utils/matching';

// Matches QUERY_PREFIX in inc/facets.php.
const QUERY_PREFIX = 'facet-';

const CONTEXT_SELECTOR = '.wp-block-hm-facet-blocks-context';
const ITEM_SELECTOR = '.wp-block-hm-facet-blocks-item';

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
	// A new selection starts again from the first batch.
	context.shown = context.limit;
	syncUrl( context.selected );
}

/**
 * Moves focus to an item of a context block, so a keyboard user carries on
 * from the first item the show more button revealed. Without this, focus is
 * lost when the button hides itself.
 *
 * @param {Element} root  The context block.
 * @param {number}  index The item's position among the context's items.
 */
function focusItem( root, index ) {
	// Items inside a nested context block belong to that one.
	const item = Array.from( root.querySelectorAll( ITEM_SELECTOR ) ).filter(
		( element ) => element.closest( CONTEXT_SELECTOR ) === root
	)[ index ];

	if ( ! item ) {
		return;
	}

	item.setAttribute( 'tabindex', '-1' );
	// The item is still hidden until the store's change reaches the page.
	window.requestAnimationFrame( () => item.focus() );
}

// The derived state here has the same names as the closures in
// register_state() in inc/blocks.php, which give the server-rendered values.
store( 'hm-facet-blocks', {
	state: {
		get isItemHidden() {
			const { item, index, items, selected, shown } = getContext();

			return (
				! itemMatches( item, selected ) ||
				! isWithinLimit( items, index, selected, shown )
			);
		},
		get isOptionSelected() {
			const { facet, option, selected } = getContext();

			return ( selected[ facet ] || '' ) === option;
		},
		get hasResults() {
			const { items, selected } = getContext();

			return hasResults( items, selected );
		},
		get hasMore() {
			const { items, selected, shown } = getContext();

			return hasMore( items, selected, shown );
		},
	},
	actions: {
		select() {
			select( getContext().option );
		},
		selectFromChange( event ) {
			select( event.target.value );
		},
		showMore() {
			const context = getContext();
			const root = getElement().ref.closest( CONTEXT_SELECTOR );
			const first = indexAtRank(
				context.items,
				context.selected,
				context.shown
			);

			context.shown += context.limit;
			focusItem( root, first );
		},
	},
} );
