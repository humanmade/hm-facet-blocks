const { test, expect } = require( '@playwright/test' );

/**
 * The demo page is created by blueprint.json from fixtures/demo.html. It has
 * an Industry facet shown as buttons, a Department facet shown as a
 * dropdown, a control for a facet that no longer exists, and four items:
 *
 * - Acme: technology, marketing
 * - Bolt: retail, legal
 * - Cask: technology and retail, marketing and legal
 * - Dune: technology, no department, plus values that no longer exist
 *
 * No item is in the Finance industry.
 */
const DEMO = '/facet-blocks-demo/';

const items = ( page ) => page.locator( '.wp-block-hm-facet-blocks-item' );
const visibleItems = ( page ) =>
	page.locator( '.wp-block-hm-facet-blocks-item:not([hidden])' );
const noResults = ( page ) =>
	page.locator( '.wp-block-hm-facet-blocks-no-results' );
const industry = ( page ) => page.getByRole( 'group', { name: 'Industry' } );

test.describe( 'Filtering', () => {
	test( 'shows every item until an option is chosen', async ( { page } ) => {
		await page.goto( DEMO );

		await expect( items( page ) ).toHaveCount( 4 );
		await expect( visibleItems( page ) ).toHaveCount( 4 );
		await expect( noResults( page ) ).toBeHidden();
		await expect(
			industry( page ).getByRole( 'button', { name: 'All' } )
		).toHaveAttribute( 'aria-pressed', 'true' );
	} );

	test( 'filters by a button and marks it pressed', async ( { page } ) => {
		await page.goto( DEMO );
		await industry( page )
			.getByRole( 'button', { name: 'Retail' } )
			.click();

		await expect( visibleItems( page ) ).toHaveText( [ 'Bolt', 'Cask' ] );
		await expect(
			industry( page ).getByRole( 'button', { name: 'Retail' } )
		).toHaveAttribute( 'aria-pressed', 'true' );
		await expect(
			industry( page ).getByRole( 'button', { name: 'All' } )
		).toHaveAttribute( 'aria-pressed', 'false' );
	} );

	test( 'needs every chosen facet to match', async ( { page } ) => {
		await page.goto( DEMO );
		await industry( page )
			.getByRole( 'button', { name: 'Retail' } )
			.click();
		await page.getByLabel( 'Department' ).selectOption( 'marketing' );

		await expect( visibleItems( page ) ).toHaveText( [ 'Cask' ] );
	} );

	test( 'hides an item with no value for a chosen facet', async ( {
		page,
	} ) => {
		await page.goto( DEMO );
		await page.getByLabel( 'Department' ).selectOption( 'legal' );

		// Dune has no department, so it only shows while Department is All.
		await expect( visibleItems( page ) ).toHaveText( [ 'Bolt', 'Cask' ] );
	} );

	test( 'shows the no results block when nothing matches', async ( {
		page,
	} ) => {
		await page.goto( DEMO );
		await industry( page )
			.getByRole( 'button', { name: 'Finance' } )
			.click();

		await expect( visibleItems( page ) ).toHaveCount( 0 );
		await expect( noResults( page ) ).toBeVisible();
		await expect( noResults( page ) ).toHaveText( 'No results found.' );

		await industry( page ).getByRole( 'button', { name: 'All' } ).click();

		await expect( visibleItems( page ) ).toHaveCount( 4 );
		await expect( noResults( page ) ).toBeHidden();
	} );

	test( 'keeps the selection in the URL', async ( { page } ) => {
		await page.goto( DEMO );
		await industry( page )
			.getByRole( 'button', { name: 'Retail' } )
			.click();
		await page.getByLabel( 'Department' ).selectOption( 'marketing' );

		await expect( page ).toHaveURL(
			/facet-industry=retail&facet-department=marketing$/
		);

		await industry( page ).getByRole( 'button', { name: 'All' } ).click();

		await expect( page ).toHaveURL( /\?facet-department=marketing$/ );
	} );

	test( 'renders a linked selection on the server', async ( { request } ) => {
		const response = await request.get(
			`${ DEMO }?facet-industry=retail&facet-department=marketing`
		);
		const html = await response.text();
		const hidden = html.match(
			/<div[^>]*wp-block-hm-facet-blocks-item[^>]* hidden>/g
		);

		// Acme, Bolt and Dune are hidden before any script runs.
		expect( hidden ).toHaveLength( 3 );
		expect( html ).toMatch(
			/<option value="marketing"[^>]* selected[^>]*>Marketing/
		);
	} );

	test( 'restores a linked selection in the browser', async ( { page } ) => {
		await page.goto( `${ DEMO }?facet-industry=technology` );

		await expect( visibleItems( page ) ).toHaveText( [
			'Acme',
			'Cask',
			'Dune',
		] );
		await expect(
			industry( page ).getByRole( 'button', { name: 'Technology' } )
		).toHaveAttribute( 'aria-pressed', 'true' );
	} );
} );

test.describe( 'Removed facets and options', () => {
	test( 'renders nothing for a control whose facet is gone', async ( {
		page,
	} ) => {
		await page.goto( DEMO );

		await expect(
			page.locator( '.wp-block-hm-facet-blocks-control' )
		).toHaveCount( 2 );
	} );

	test( 'ignores item values that are no longer defined', async ( {
		request,
	} ) => {
		const response = await request.get( DEMO );
		const html = await response.text();

		expect( html ).not.toContain( 'removed-option' );
		expect( html ).not.toContain( 'removed-facet' );
	} );

	test( 'ignores a URL value that is not a defined option', async ( {
		page,
	} ) => {
		await page.goto(
			`${ DEMO }?facet-industry=removed-option&facet-removed-facet=anything`
		);

		await expect( visibleItems( page ) ).toHaveCount( 4 );
	} );
} );
