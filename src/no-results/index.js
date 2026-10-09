import { registerBlockType } from '@wordpress/blocks';
import {
	InnerBlocks,
	useBlockProps,
	useInnerBlocksProps,
} from '@wordpress/block-editor';
import { __ } from '@wordpress/i18n';

import metadata from './block.json';

const TEMPLATE = [
	[
		'core/paragraph',
		{ content: __( 'No results found.', 'hm-facet-blocks' ) },
	],
];

function Edit() {
	const innerBlocksProps = useInnerBlocksProps( useBlockProps(), {
		template: TEMPLATE,
	} );

	return <div { ...innerBlocksProps } />;
}

registerBlockType( metadata.name, {
	edit: Edit,
	save: () => <InnerBlocks.Content />,
} );
