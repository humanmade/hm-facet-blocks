import { InspectorControls, useBlockProps } from '@wordpress/block-editor';
import {
	Disabled,
	PanelBody,
	Placeholder,
	SelectControl,
	TextControl,
	ToggleControl,
} from '@wordpress/components';
import { useInstanceId } from '@wordpress/compose';
import { __, sprintf } from '@wordpress/i18n';

export default function Edit( { attributes, setAttributes, context } ) {
	const { facet: facetSlug, display, allLabel, showLabel } = attributes;
	const facets = context[ 'hm-facet-blocks/facets' ] || [];
	const facet = facets.find( ( { slug } ) => slug === facetSlug );
	const id = useInstanceId( Edit, 'hm-facet-control' );
	const blockProps = useBlockProps( {
		className: facet ? `is-display-${ display }` : undefined,
	} );

	const labelClass =
		'wp-block-hm-facet-blocks-control__label' +
		( showLabel ? '' : ' screen-reader-text' );
	const options = facet
		? [
				{
					slug: '',
					label: allLabel || __( 'All', 'hm-facet-blocks' ),
				},
				...facet.options,
			]
		: [];

	let placeholder = __(
		'Choose which facet this control filters in the block settings.',
		'hm-facet-blocks'
	);

	if ( facets.length === 0 ) {
		placeholder = __(
			'Add a facet to the Facet context block, then choose it here.',
			'hm-facet-blocks'
		);
	} else if ( facetSlug ) {
		placeholder = sprintf(
			/* translators: %s: facet slug. */
			__(
				'The "%s" facet no longer exists, so this control shows nothing on the front end. Choose another facet or remove this block.',
				'hm-facet-blocks'
			),
			facetSlug
		);
	}

	return (
		<>
			<InspectorControls>
				<PanelBody title={ __( 'Settings', 'hm-facet-blocks' ) }>
					<SelectControl
						__next40pxDefaultSize
						__nextHasNoMarginBottom
						label={ __( 'Facet', 'hm-facet-blocks' ) }
						value={ facet ? facetSlug : '' }
						options={ [
							{
								value: '',
								label: __(
									'Choose a facet',
									'hm-facet-blocks'
								),
								disabled: true,
							},
							...facets.map( ( { slug, label } ) => ( {
								value: slug,
								label,
							} ) ),
						] }
						onChange={ ( value ) =>
							setAttributes( { facet: value } )
						}
					/>
					<SelectControl
						__next40pxDefaultSize
						__nextHasNoMarginBottom
						label={ __( 'Display as', 'hm-facet-blocks' ) }
						value={ display }
						options={ [
							{
								value: 'buttons',
								label: __( 'Buttons', 'hm-facet-blocks' ),
							},
							{
								value: 'select',
								label: __( 'Dropdown', 'hm-facet-blocks' ),
							},
						] }
						onChange={ ( value ) =>
							setAttributes( { display: value } )
						}
					/>
					<TextControl
						__next40pxDefaultSize
						__nextHasNoMarginBottom
						label={ __(
							'Label for the "all" option',
							'hm-facet-blocks'
						) }
						placeholder={ __( 'All', 'hm-facet-blocks' ) }
						value={ allLabel }
						onChange={ ( value ) =>
							setAttributes( { allLabel: value } )
						}
					/>
					<ToggleControl
						__nextHasNoMarginBottom
						label={ __( 'Show the facet name', 'hm-facet-blocks' ) }
						help={ __(
							'When off, the name is still read out by screen readers.',
							'hm-facet-blocks'
						) }
						checked={ showLabel }
						onChange={ ( value ) =>
							setAttributes( { showLabel: value } )
						}
					/>
				</PanelBody>
			</InspectorControls>

			<div { ...blockProps }>
				{ ! facet && (
					<Placeholder
						icon="filter"
						label={ __( 'Facet control', 'hm-facet-blocks' ) }
						instructions={ placeholder }
					/>
				) }

				{ facet && display === 'select' && (
					<Disabled style={ { display: 'contents' } }>
						<label className={ labelClass } htmlFor={ id }>
							{ facet.label }
						</label>
						<select
							className="wp-block-hm-facet-blocks-control__select"
							id={ id }
						>
							{ options.map( ( option ) => (
								<option key={ option.slug }>
									{ option.label }
								</option>
							) ) }
						</select>
					</Disabled>
				) }

				{ facet && display !== 'select' && (
					<Disabled style={ { display: 'contents' } }>
						<span className={ labelClass }>{ facet.label }</span>
						<div className="wp-block-hm-facet-blocks-control__options">
							{ options.map( ( option, index ) => (
								<button
									key={ option.slug }
									type="button"
									className="wp-block-hm-facet-blocks-control__option"
									aria-pressed={ index === 0 }
								>
									{ option.label }
								</button>
							) ) }
						</div>
					</Disabled>
				) }
			</div>
		</>
	);
}
