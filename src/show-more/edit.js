import { InspectorControls, useBlockProps } from '@wordpress/block-editor';
import {
	Disabled,
	PanelBody,
	Placeholder,
	TextControl,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';

export default function Edit( { attributes, setAttributes, context } ) {
	const { label } = attributes;
	const hasLimit = context[ 'hm-facet-blocks/limit' ] > 0;

	return (
		<>
			<InspectorControls>
				<PanelBody title={ __( 'Settings', 'hm-facet-blocks' ) }>
					<TextControl
						__next40pxDefaultSize
						__nextHasNoMarginBottom
						label={ __( 'Button label', 'hm-facet-blocks' ) }
						placeholder={ __( 'Show more', 'hm-facet-blocks' ) }
						value={ label }
						onChange={ ( value ) =>
							setAttributes( { label: value } )
						}
					/>
				</PanelBody>
			</InspectorControls>

			<div { ...useBlockProps() }>
				{ ! hasLimit && (
					<Placeholder
						icon="plus-alt2"
						label={ __( 'Facet show more', 'hm-facet-blocks' ) }
						instructions={ __(
							'Every item shows, so this button never appears on the front end. Set "Items to show at a time" on the Facet context block to use it.',
							'hm-facet-blocks'
						) }
					/>
				) }

				{ hasLimit && (
					<Disabled style={ { display: 'contents' } }>
						<button
							type="button"
							className="wp-block-hm-facet-blocks-show-more__button wp-element-button"
						>
							{ label || __( 'Show more', 'hm-facet-blocks' ) }
						</button>
					</Disabled>
				) }
			</div>
		</>
	);
}
