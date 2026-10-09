import {
	InnerBlocks,
	InspectorControls,
	store as blockEditorStore,
	useBlockProps,
	useInnerBlocksProps,
} from '@wordpress/block-editor';
import { PanelBody } from '@wordpress/components';
import { useRegistry, useSelect } from '@wordpress/data';
import { useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

import FacetsPanel from './facets-panel';

const ITEM_BLOCK = 'hm-facet-blocks/item';
const CONTEXT_BLOCK = 'hm-facet-blocks/context';

const TEMPLATE = [
	[ 'hm-facet-blocks/control' ],
	[ ITEM_BLOCK, {}, [ [ 'core/paragraph' ] ] ],
	[
		'hm-facet-blocks/no-results',
		{},
		[
			[
				'core/paragraph',
				{ content: __( 'No results found.', 'hm-facet-blocks' ) },
			],
		],
	],
];

/**
 * The item blocks that belong to a context block, at any depth. Items inside
 * a nested context block belong to that one.
 *
 * @param {string} clientId The context block.
 * @return {Array<{clientId: string, values: Object}>} The items and their values.
 */
function useItems( clientId ) {
	// Keyed by client ID so the result is shallowly equal between renders
	// while no item's values change.
	const valuesById = useSelect(
		( select ) => {
			const {
				getBlockAttributes,
				getBlockName,
				getBlockParentsByBlockName,
				getClientIdsOfDescendants,
			} = select( blockEditorStore );
			const result = {};

			getClientIdsOfDescendants( clientId ).forEach( ( id ) => {
				if (
					getBlockName( id ) === ITEM_BLOCK &&
					getBlockParentsByBlockName(
						id,
						CONTEXT_BLOCK,
						true
					)[ 0 ] === clientId
				) {
					result[ id ] = getBlockAttributes( id ).values;
				}
			} );

			return result;
		},
		[ clientId ]
	);

	return useMemo(
		() =>
			Object.entries( valuesById ).map( ( [ id, values ] ) => ( {
				clientId: id,
				values,
			} ) ),
		[ valuesById ]
	);
}

export default function Edit( { attributes, setAttributes, clientId } ) {
	const { facets } = attributes;
	const items = useItems( clientId );
	const registry = useRegistry();

	/**
	 * Rewrites the values of the context's items in one undo step.
	 *
	 * @param {Function} getValues Receives an item's values, returns the new ones.
	 */
	const updateItems = ( getValues ) => {
		const { updateBlockAttributes } = registry.dispatch( blockEditorStore );

		registry.batch( () => {
			items.forEach( ( item ) => {
				updateBlockAttributes( item.clientId, {
					values: getValues( item.values ),
				} );
			} );
		} );
	};

	const innerBlocksProps = useInnerBlocksProps( useBlockProps(), {
		template: TEMPLATE,
		renderAppender: InnerBlocks.ButtonBlockAppender,
	} );

	return (
		<>
			<InspectorControls>
				<PanelBody title={ __( 'Facets', 'hm-facet-blocks' ) }>
					<FacetsPanel
						facets={ facets }
						items={ items }
						onChange={ ( next ) =>
							setAttributes( { facets: next } )
						}
						updateItems={ updateItems }
					/>
				</PanelBody>
			</InspectorControls>
			<div { ...innerBlocksProps } />
		</>
	);
}
