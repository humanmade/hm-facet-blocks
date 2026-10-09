const { test, expect } = require( '@playwright/test' );

/**
 * The limit page is created by blueprint.json from fixtures/limit.html. Its
 * context block shows two items at a time, and it has an Industry facet, a
 * show more block and five items:
 *
 * - Ash: technology
 * - Birch: retail
 * - Cedar: technology
 * - Dogwood: retail
 * - Elm: technology
 *
 * No item is in the Finance industry.
 */
const LIMIT = '/facet-blocks-limit/';

const visibleItems = ( page ) =>
	page.locator( '.wp-block-hm-facet-blocks-item:not([hidden])' );
const showMore = ( page ) => page.getByRole( 'button', { name: 'Show more' } );
const industry = ( page ) => page.getByRole( 'group', { name: 'Industry' } );

/**
 * The opening tags of one of the plugin's blocks in a server response.
 *
 * @param {string} html  The response body.
 * @param {string} block The block's name without its namespace.
 * @return {string[]} The tags, in page order.
 */
const wrappers = ( html, block ) =>
	html.match(
		new RegExp(
			`<div[^>]*wp-block-hm-facet-blocks-${ block }[ "][^>]*>`,
			'g'
		)
	) || [];
const isHidden = ( tag ) => /\shidden[\s>=]/.test( tag );

test.describe( 'Show more', () => {
	test( 'renders the first batch on the server', async ( { request } ) => {
		const response = await request.get( LIMIT );
		const html = await response.text();

		// Ash and Birch show before any script runs.
		expect( wrappers( html, 'item' ).map( isHidden ) ).toEqual( [
			false,
			false,
			true,
			true,
			true,
		] );
		expect( wrappers( html, 'show-more' ).map( isHidden ) ).toEqual( [
			false,
		] );
	} );

	test( 'counts only matching items on the server', async ( { request } ) => {
		const response = await request.get(
			`${ LIMIT }?facet-industry=technology`
		);
		const html = await response.text();

		// Ash and Cedar show. Elm is the third technology item.
		expect( wrappers( html, 'item' ).map( isHidden ) ).toEqual( [
			false,
			true,
			false,
			true,
			true,
		] );
		expect( wrappers( html, 'show-more' ).map( isHidden ) ).toEqual( [
			false,
		] );
	} );

	test( 'hides the button on the server when nothing is left', async ( {
		request,
	} ) => {
		const response = await request.get(
			`${ LIMIT }?facet-industry=retail`
		);
		const html = await response.text();

		expect( wrappers( html, 'show-more' ).map( isHidden ) ).toEqual( [
			true,
		] );
	} );

	test( 'reveals the next batch until none are left', async ( { page } ) => {
		await page.goto( LIMIT );

		await expect( visibleItems( page ) ).toHaveText( [ 'Ash', 'Birch' ] );

		await showMore( page ).click();

		await expect( visibleItems( page ) ).toHaveText( [
			'Ash',
			'Birch',
			'Cedar',
			'Dogwood',
		] );
		await expect( showMore( page ) ).toBeVisible();

		await showMore( page ).click();

		await expect( visibleItems( page ) ).toHaveCount( 5 );
		await expect( showMore( page ) ).toBeHidden();
	} );

	test( 'moves focus to the first item it reveals', async ( { page } ) => {
		await page.goto( LIMIT );
		await showMore( page ).click();

		await expect( visibleItems( page ).nth( 2 ) ).toBeFocused();

		await showMore( page ).click();

		await expect( visibleItems( page ).nth( 4 ) ).toBeFocused();
	} );

	test( 'applies the limit to the filtered items', async ( { page } ) => {
		await page.goto( LIMIT );
		await industry( page )
			.getByRole( 'button', { name: 'Technology' } )
			.click();

		await expect( visibleItems( page ) ).toHaveText( [ 'Ash', 'Cedar' ] );

		await showMore( page ).click();

		await expect( visibleItems( page ) ).toHaveText( [
			'Ash',
			'Cedar',
			'Elm',
		] );
		await expect( showMore( page ) ).toBeHidden();
	} );

	test( 'goes back to the first batch when the selection changes', async ( {
		page,
	} ) => {
		await page.goto( LIMIT );
		await showMore( page ).click();

		await expect( visibleItems( page ) ).toHaveCount( 4 );

		await industry( page )
			.getByRole( 'button', { name: 'Retail' } )
			.click();

		// Both retail items fit in one batch.
		await expect( visibleItems( page ) ).toHaveText( [
			'Birch',
			'Dogwood',
		] );
		await expect( showMore( page ) ).toBeHidden();

		await industry( page ).getByRole( 'button', { name: 'All' } ).click();

		await expect( visibleItems( page ) ).toHaveText( [ 'Ash', 'Birch' ] );
		await expect( showMore( page ) ).toBeVisible();
	} );

	test( 'hides the button when nothing matches', async ( { page } ) => {
		await page.goto( LIMIT );
		await industry( page )
			.getByRole( 'button', { name: 'Finance' } )
			.click();

		await expect( showMore( page ) ).toBeHidden();
		await expect(
			page.locator( '.wp-block-hm-facet-blocks-no-results' )
		).toBeVisible();
	} );

	test( 'never shows the button for a context with no limit', async ( {
		page,
	} ) => {
		await page.goto( '/facet-blocks-demo/' );

		await expect( visibleItems( page ) ).toHaveCount( 4 );
		await expect(
			page.locator( '.wp-block-hm-facet-blocks-show-more' )
		).toBeHidden();
	} );

	// fixtures/nested.html has a context block showing one item at a time,
	// holding an item, a second context block with the same limit and two
	// items of its own, then another item.
	test( 'counts the items of a nested context block separately', async ( {
		page,
	} ) => {
		await page.goto( '/facet-blocks-nested/' );

		await expect( visibleItems( page ) ).toHaveText( [
			'Outer one',
			'Inner one',
		] );
	} );
} );
