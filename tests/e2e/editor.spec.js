const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

const ITEM = 'hm-facet-blocks/item';

/**
 * Opens the demo page, created by blueprint.json from fixtures/demo.html, in
 * the editor and selects its context block.
 *
 * @param {Object} fixtures        Playwright fixtures.
 * @param {Object} fixtures.page   The page.
 * @param {Object} fixtures.admin  Admin utilities.
 * @param {Object} fixtures.editor Editor utilities.
 */
async function openDemo( { page, admin, editor } ) {
	await page.goto( '/facet-blocks-demo/' );

	const bodyClass = await page.locator( 'body' ).getAttribute( 'class' );
	const postId = bodyClass.match( /page-id-(\d+)/ )[ 1 ];

	await admin.editPost( postId );
	await editor.selectBlocks(
		editor.canvas.locator( '[data-type="hm-facet-blocks/context"]' )
	);
	await editor.openDocumentSettingsSidebar();
}

/**
 * The values of every item block, in document order.
 *
 * @param {Object} editor Editor utilities.
 * @return {Promise<Object[]>} Item values.
 */
async function getItemValues( editor ) {
	const collect = ( blocks ) =>
		blocks.flatMap( ( block ) => [
			...( block.name === ITEM ? [ block.attributes.values ] : [] ),
			...collect( block.innerBlocks ),
		] );

	return collect( await editor.getBlocks() );
}

test.describe( 'Facet context editor', () => {
	test( 'reports orphaned item values and removes them', async ( {
		page,
		admin,
		editor,
	} ) => {
		await openDemo( { page, admin, editor } );

		const notice = page.locator( '.components-notice' ).filter( {
			hasText: 'no longer exists',
		} );

		await expect( notice ).toContainText( '1 item has values' );
		expect( ( await getItemValues( editor ) )[ 3 ] ).toEqual( {
			industry: [ 'technology', 'removed-option' ],
			'removed-facet': [ 'anything' ],
		} );

		await notice
			.getByRole( 'button', { name: 'Remove these values' } )
			.click();

		await expect( notice ).toBeHidden();
		expect( ( await getItemValues( editor ) )[ 3 ] ).toEqual( {
			industry: [ 'technology' ],
		} );
	} );

	test( 'asks before removing an option that items use, and can keep their values', async ( {
		page,
		admin,
		editor,
	} ) => {
		await openDemo( { page, admin, editor } );
		await page.getByRole( 'button', { name: 'Remove Retail' } ).click();

		const dialog = page.getByRole( 'dialog', {
			name: 'Remove "Retail"?',
		} );

		await expect( dialog ).toContainText( '2 items use this option.' );

		await dialog
			.getByRole( 'button', { name: 'Remove, keep item values' } )
			.click();

		// Bolt and Cask keep "retail", which now counts as orphaned
		// alongside Dune.
		await expect(
			page.locator( '.components-notice' ).filter( {
				hasText: 'no longer exists',
			} )
		).toContainText( '3 items have values' );
		expect( ( await getItemValues( editor ) )[ 1 ].industry ).toEqual( [
			'retail',
		] );
	} );

	test( 'can clear a removed option from the items that use it', async ( {
		page,
		admin,
		editor,
	} ) => {
		await openDemo( { page, admin, editor } );
		await page.getByRole( 'button', { name: 'Remove Retail' } ).click();
		await page
			.getByRole( 'dialog', { name: 'Remove "Retail"?' } )
			.getByRole( 'button', { name: 'Remove and clear from items' } )
			.click();

		const values = await getItemValues( editor );

		expect( values[ 1 ] ).toEqual( { department: [ 'legal' ] } );
		expect( values[ 2 ].industry ).toEqual( [ 'technology' ] );
	} );

	test( 'removes an unused option without asking', async ( {
		page,
		admin,
		editor,
	} ) => {
		await openDemo( { page, admin, editor } );
		await page.getByRole( 'button', { name: 'Remove Finance' } ).click();

		await expect( page.getByRole( 'dialog' ) ).toBeHidden();
		await expect(
			page.getByRole( 'button', { name: 'Remove Finance' } )
		).toBeHidden();
	} );

	test( 'gives a new option a slug that survives a rename', async ( {
		page,
		admin,
		editor,
	} ) => {
		await openDemo( { page, admin, editor } );

		await page.getByLabel( 'New option' ).first().fill( 'Health care' );
		await page
			.getByRole( 'button', { name: 'Add option' } )
			.first()
			.click();
		await page
			.getByRole( 'textbox', { name: 'Option name' } )
			.nth( 3 )
			.fill( 'Healthcare & life sciences' );

		const [ context ] = await editor.getBlocks();
		const option = context.attributes.facets[ 0 ].options[ 3 ];

		expect( option ).toEqual( {
			slug: 'health-care',
			label: 'Healthcare & life sciences',
		} );
	} );
} );
