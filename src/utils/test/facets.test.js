import { describe, expect, it } from 'vitest';

import {
	createSlug,
	getOrphans,
	removeFromValues,
	removeOrphans,
	toggleValue,
	usesFacet,
} from '../facets';

const facets = [
	{
		slug: 'industry',
		label: 'Industry',
		options: [
			{ slug: 'technology', label: 'Technology' },
			{ slug: 'retail', label: 'Retail' },
		],
	},
	{
		slug: 'department',
		label: 'Department',
		options: [ { slug: 'legal', label: 'Legal' } ],
	},
];

describe( 'createSlug', () => {
	it( 'slugifies a label', () => {
		expect( createSlug( 'Retail & consumer goods' ) ).toBe(
			'retail-consumer-goods'
		);
	} );

	it( 'strips accents', () => {
		expect( createSlug( 'Café  Société' ) ).toBe( 'cafe-societe' );
	} );

	it( 'adds a suffix when the slug is taken', () => {
		expect( createSlug( 'Retail', [ 'retail' ] ) ).toBe( 'retail-2' );
		expect( createSlug( 'Retail', [ 'retail', 'retail-2' ] ) ).toBe(
			'retail-3'
		);
	} );

	it( 'falls back when the label has no usable characters', () => {
		expect( createSlug( '&&&' ) ).toBe( 'item' );
	} );
} );

describe( 'getOrphans', () => {
	it( 'finds nothing when every value is defined', () => {
		expect(
			getOrphans( { industry: [ 'retail' ], department: [] }, facets )
		).toEqual( [] );
	} );

	it( 'finds a value for a removed option', () => {
		expect(
			getOrphans( { industry: [ 'retail', 'removed' ] }, facets )
		).toEqual( [ { facet: 'industry', option: 'removed' } ] );
	} );

	it( 'finds every value of a removed facet', () => {
		expect( getOrphans( { removed: [ 'a', 'b' ] }, facets ) ).toEqual( [
			{ facet: 'removed', option: 'a' },
			{ facet: 'removed', option: 'b' },
		] );
	} );

	it( 'copes with missing or malformed values', () => {
		expect( getOrphans( undefined, facets ) ).toEqual( [] );
		expect( getOrphans( { industry: 'retail' }, facets ) ).toEqual( [] );
	} );
} );

describe( 'removeOrphans', () => {
	it( 'keeps defined values and drops the rest', () => {
		expect(
			removeOrphans(
				{
					industry: [ 'removed', 'retail' ],
					removed: [ 'a' ],
					department: [ 'gone' ],
				},
				facets
			)
		).toEqual( { industry: [ 'retail' ] } );
	} );

	it( 'leaves nothing orphaned', () => {
		const values = { industry: [ 'removed', 'technology' ], old: [ 'x' ] };

		expect( getOrphans( removeOrphans( values, facets ), facets ) ).toEqual(
			[]
		);
	} );
} );

describe( 'usesFacet', () => {
	const values = { industry: [ 'retail' ], department: [] };

	it( 'answers for a whole facet', () => {
		expect( usesFacet( values, 'industry' ) ).toBe( true );
		expect( usesFacet( values, 'department' ) ).toBe( false );
		expect( usesFacet( values, 'missing' ) ).toBe( false );
	} );

	it( 'answers for one option', () => {
		expect( usesFacet( values, 'industry', 'retail' ) ).toBe( true );
		expect( usesFacet( values, 'industry', 'technology' ) ).toBe( false );
	} );
} );

describe( 'removeFromValues', () => {
	it( 'removes a whole facet', () => {
		expect(
			removeFromValues(
				{ industry: [ 'retail' ], department: [ 'legal' ] },
				'industry'
			)
		).toEqual( { department: [ 'legal' ] } );
	} );

	it( 'removes one option and keeps the others', () => {
		expect(
			removeFromValues(
				{ industry: [ 'retail', 'technology' ] },
				'industry',
				'retail'
			)
		).toEqual( { industry: [ 'technology' ] } );
	} );

	it( 'drops the facet key when its last option goes', () => {
		expect(
			removeFromValues( { industry: [ 'retail' ] }, 'industry', 'retail' )
		).toEqual( {} );
	} );
} );

describe( 'toggleValue', () => {
	it( 'ticks an option', () => {
		expect( toggleValue( {}, 'industry', 'retail', true ) ).toEqual( {
			industry: [ 'retail' ],
		} );
	} );

	it( 'does not add an option twice', () => {
		expect(
			toggleValue(
				{ industry: [ 'retail' ] },
				'industry',
				'retail',
				true
			)
		).toEqual( { industry: [ 'retail' ] } );
	} );

	it( 'unticks an option', () => {
		expect(
			toggleValue(
				{ industry: [ 'retail', 'technology' ] },
				'industry',
				'retail',
				false
			)
		).toEqual( { industry: [ 'technology' ] } );
	} );
} );
