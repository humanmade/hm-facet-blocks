import { describe, expect, it } from 'vitest';

import {
	hasMore,
	hasResults,
	indexAtRank,
	isWithinLimit,
	itemMatches,
} from '../matching';

describe( 'itemMatches', () => {
	it( 'matches everything when nothing is selected', () => {
		expect( itemMatches( {}, { industry: '', department: '' } ) ).toBe(
			true
		);
	} );

	it( 'matches any of the item values within a facet', () => {
		const values = { industry: [ 'technology', 'retail' ] };

		expect( itemMatches( values, { industry: 'retail' } ) ).toBe( true );
		expect( itemMatches( values, { industry: 'finance' } ) ).toBe( false );
	} );

	it( 'needs every selected facet to match', () => {
		const values = { industry: [ 'retail' ], department: [ 'legal' ] };

		expect(
			itemMatches( values, { industry: 'retail', department: 'legal' } )
		).toBe( true );
		expect(
			itemMatches( values, { industry: 'retail', department: 'sales' } )
		).toBe( false );
	} );

	it( 'hides an item with no value for a selected facet', () => {
		expect(
			itemMatches( { industry: [ 'retail' ] }, { department: 'legal' } )
		).toBe( false );
	} );
} );

describe( 'hasResults', () => {
	const items = [
		{ industry: [ 'retail' ] },
		{ industry: [ 'technology' ] },
	];

	it( 'is true while any item matches', () => {
		expect( hasResults( items, { industry: 'retail' } ) ).toBe( true );
	} );

	it( 'is false when no item matches', () => {
		expect( hasResults( items, { industry: 'finance' } ) ).toBe( false );
		expect( hasResults( [], { industry: '' } ) ).toBe( false );
	} );
} );

// Five items alternating between technology and retail.
const alternating = [
	{ industry: [ 'technology' ] },
	{ industry: [ 'retail' ] },
	{ industry: [ 'technology' ] },
	{ industry: [ 'retail' ] },
	{ industry: [ 'technology' ] },
];

describe( 'isWithinLimit', () => {
	it( 'has every item within a limit of zero', () => {
		expect( isWithinLimit( alternating, 4, { industry: '' }, 0 ) ).toBe(
			true
		);
	} );

	it( 'counts items in order', () => {
		const selected = { industry: '' };

		expect( isWithinLimit( alternating, 0, selected, 2 ) ).toBe( true );
		expect( isWithinLimit( alternating, 1, selected, 2 ) ).toBe( true );
		expect( isWithinLimit( alternating, 2, selected, 2 ) ).toBe( false );
		expect( isWithinLimit( alternating, 4, selected, 2 ) ).toBe( false );
	} );

	it( 'only counts matching items', () => {
		const selected = { industry: 'technology' };

		// The third item is the second technology item.
		expect( isWithinLimit( alternating, 2, selected, 2 ) ).toBe( true );
		expect( isWithinLimit( alternating, 4, selected, 2 ) ).toBe( false );
	} );
} );

describe( 'hasMore', () => {
	it( 'is true while matching items are past the limit', () => {
		expect( hasMore( alternating, { industry: '' }, 2 ) ).toBe( true );
		expect( hasMore( alternating, { industry: '' }, 4 ) ).toBe( true );
		expect( hasMore( alternating, { industry: '' }, 5 ) ).toBe( false );
		expect( hasMore( alternating, { industry: '' }, 6 ) ).toBe( false );
	} );

	it( 'only counts matching items', () => {
		expect( hasMore( alternating, { industry: 'technology' }, 2 ) ).toBe(
			true
		);
		expect( hasMore( alternating, { industry: 'retail' }, 2 ) ).toBe(
			false
		);
	} );

	it( 'is false for a limit of zero', () => {
		expect( hasMore( alternating, { industry: '' }, 0 ) ).toBe( false );
	} );
} );

describe( 'indexAtRank', () => {
	it( 'finds the matching item at a position', () => {
		expect( indexAtRank( alternating, { industry: '' }, 2 ) ).toBe( 2 );
		expect( indexAtRank( alternating, { industry: 'retail' }, 1 ) ).toBe(
			3
		);
	} );

	it( 'is -1 when fewer items match', () => {
		expect( indexAtRank( alternating, { industry: 'retail' }, 2 ) ).toBe(
			-1
		);
	} );
} );
