import { InspectorControls, useBlockProps } from '@wordpress/block-editor';
import { Disabled, PanelBody, TextControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

export default function Edit( { attributes, setAttributes } ) {
	const { label } = attributes;

	return (
		<>
			<InspectorControls>
				<PanelBody title={ __( 'Settings', 'hm-facet-blocks' ) }>
					<TextControl
						__next40pxDefaultSize
						__nextHasNoMarginBottom
						label={ __( 'Button label', 'hm-facet-blocks' ) }
						placeholder={ __(
							'Clear all filters',
							'hm-facet-blocks'
						) }
						value={ label }
						onChange={ ( value ) =>
							setAttributes( { label: value } )
						}
					/>
				</PanelBody>
			</InspectorControls>

			<div { ...useBlockProps() }>
				<Disabled style={ { display: 'contents' } }>
					<button
						type="button"
						className="wp-block-hm-facet-blocks-clear__button"
					>
						{ label ||
							__( 'Clear all filters', 'hm-facet-blocks' ) }
					</button>
				</Disabled>
			</div>
		</>
	);
}
