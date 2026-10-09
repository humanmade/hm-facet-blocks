const { test, expect } = require( '@playwright/test' );

/**
 * The selection page is created by blueprint.json from
 * fixtures/selection.html. It has an Industry facet shown as buttons, a
 * Department facet shown as a dropdown, a selection block, a clear block and
 * three items:
 *
 * - Acme: technology, marketing
 * - Bolt: retail, legal
 * - Cask: technology and retail, marketing and legal
 */
const SELECTION = '/facet-blocks-selection/';

const visibleItems = ( page ) =>
	page.locator( '.wp-block-hm-facet-blocks-item:not([hidden])' );
const industry = ( page ) => page.getByRole( 'group', { name: 'Industry' } );
const department = ( page ) => page.getByLabel( 'Department' );
const selected = ( page ) =>
	page.getByRole( 'group', { name: 'Selected filters' } );
const clear = ( page ) =>
	page.getByRole( 'button', { name: 'Clear all filters' } );

/**
 * The opening tags in a server response that have a class.
 *
 * @param {string} html      The response body.
 * @param {string} className The class, without its `wp-block-hm-facet-blocks-` prefix.
 * @return {string[]} The tags, in page order.
 */
const tags = ( html, className ) =>
	html.match(
		new RegExp(
			`<(?:div|button)[^>]*wp-block-hm-facet-blocks-${ className }[ "][^>]*>`,
			'g'
		)
	) || [];
const isHidden = ( tag ) => /\shidden[\s>=]/.test( tag );

test.describe( 'Selection and clear', () => {
	test( 'renders both hidden on the server while nothing is selected', async ( {
		request,
	} ) => {
		const response = await request.get( SELECTION );
		const html = await response.text();

		expect( tags( html, 'selection' ).map( isHidden ) ).toEqual( [ true ] );
		expect( tags( html, 'clear' ).map( isHidden ) ).toEqual( [ true ] );
	} );

	test( 'renders a linked selection on the server', async ( { request } ) => {
		const response = await request.get(
			`${ SELECTION }?facet-department=legal`
		);
		const html = await response.text();

		expect( tags( html, 'selection' ).map( isHidden ) ).toEqual( [
			false,
		] );
		// Industry is on all, so only the Department button shows.
		expect( tags( html, 'selection__option' ).map( isHidden ) ).toEqual( [
			true,
			false,
		] );
		expect( html ).toContain( 'Remove Department filter:' );
		expect( html ).toMatch( /state\.selectedLabel"[^>]*>Legal</ );
		expect( tags( html, 'clear' ).map( isHidden ) ).toEqual( [ false ] );
	} );

	test( 'shows a button for each selected option', async ( { page } ) => {
		await page.goto( SELECTION );

		await expect( selected( page ) ).toBeHidden();
		await expect( clear( page ) ).toBeHidden();

		await industry( page )
			.getByRole( 'button', { name: 'Technology' } )
			.click();

		await expect( selected( page ).getByRole( 'button' ) ).toHaveText( [
			'Remove Industry filter: Technology',
		] );
		await expect( clear( page ) ).toBeVisible();

		await department( page ).selectOption( 'Legal' );

		await expect( selected( page ).getByRole( 'button' ) ).toHaveText( [
			'Remove Industry filter: Technology',
			'Remove Department filter: Legal',
		] );
	} );

	test( 'follows the option a control changes to', async ( { page } ) => {
		await page.goto( `${ SELECTION }?facet-industry=technology` );
		await industry( page )
			.getByRole( 'button', { name: 'Retail' } )
			.click();

		await expect( selected( page ).getByRole( 'button' ) ).toHaveText( [
			'Remove Industry filter: Retail',
		] );
	} );

	test( 'removes one option and keeps the other', async ( { page } ) => {
		await page.goto(
			`${ SELECTION }?facet-industry=retail&facet-department=legal`
		);

		await expect( visibleItems( page ) ).toHaveText( [ 'Bolt', 'Cask' ] );

		await selected( page )
			.getByRole( 'button', { name: 'Remove Industry filter: Retail' } )
			.click();

		await expect( selected( page ).getByRole( 'button' ) ).toHaveText( [
			'Remove Department filter: Legal',
		] );
		await expect(
			industry( page ).getByRole( 'button', { name: 'All' } )
		).toHaveAttribute( 'aria-pressed', 'true' );
		await expect( department( page ) ).toHaveValue( 'legal' );
		expect( new URL( page.url() ).search ).toBe(
			'?facet-department=legal'
		);
		// Focus goes to the button that is left.
		await expect(
			selected( page ).getByRole( 'button', {
				name: 'Remove Department filter: Legal',
			} )
		).toBeFocused();
	} );

	test( 'moves focus to the first control when the last option is removed', async ( {
		page,
	} ) => {
		await page.goto( `${ SELECTION }?facet-department=legal` );
		await selected( page )
			.getByRole( 'button', { name: 'Remove Department filter: Legal' } )
			.click();

		await expect( selected( page ) ).toBeHidden();
		await expect( clear( page ) ).toBeHidden();
		await expect( visibleItems( page ) ).toHaveCount( 3 );
		await expect( department( page ) ).toHaveValue( '' );
		await expect(
			industry( page ).getByRole( 'button', { name: 'All' } )
		).toBeFocused();
	} );

	test( 'clears every facet', async ( { page } ) => {
		await page.goto(
			`${ SELECTION }?facet-industry=technology&facet-department=legal&other=kept`
		);

		await expect( visibleItems( page ) ).toHaveText( [ 'Cask' ] );

		await clear( page ).click();

		await expect( visibleItems( page ) ).toHaveCount( 3 );
		await expect( selected( page ) ).toBeHidden();
		await expect( clear( page ) ).toBeHidden();
		await expect( department( page ) ).toHaveValue( '' );
		await expect(
			industry( page ).getByRole( 'button', { name: 'All' } )
		).toHaveAttribute( 'aria-pressed', 'true' );
		// Only the facet parameters go.
		expect( new URL( page.url() ).search ).toBe( '?other=kept' );
		await expect(
			industry( page ).getByRole( 'button', { name: 'All' } )
		).toBeFocused();
	} );
} );
