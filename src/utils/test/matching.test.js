import { hasResults, itemMatches } from '../matching';

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
