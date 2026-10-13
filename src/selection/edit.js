import { useBlockProps } from '@wordpress/block-editor';
import { Disabled, Placeholder } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

export default function Edit( { context } ) {
	// A facet with no options can never be selected, so it has no button.
	const facets = ( context[ 'hm-facet-blocks/facets' ] || [] ).filter(
		( { options } ) => options?.length > 0
	);

	return (
		<div { ...useBlockProps() }>
			{ facets.length === 0 && (
				<Placeholder
					icon="tag"
					label={ __( 'Facet selection', 'hm-facet-blocks' ) }
					instructions={ __(
						'Add a facet with options to the Facet context block. Each selected option shows here as a button that removes it.',
						'hm-facet-blocks'
					) }
				/>
			) }

			{ /* Nothing is selected in the editor, so each facet's first
			     option stands in to show how a button looks. */ }
			{ facets.length > 0 && (
				<Disabled style={ { display: 'contents' } }>
					{ facets.map( ( { slug, options } ) => (
						<button
							key={ slug }
							type="button"
							className="wp-block-hm-facet-blocks-selection__option"
						>
							{ options[ 0 ].label }
						</button>
					) ) }
				</Disabled>
			) }
		</div>
	);
}
