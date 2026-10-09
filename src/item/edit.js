import {
	InnerBlocks,
	InspectorControls,
	useBlockProps,
	useInnerBlocksProps,
} from '@wordpress/block-editor';
import { CheckboxControl, Notice, PanelBody } from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';

import { getOrphans, removeOrphans, toggleValue } from '../utils/facets';

export default function Edit( { attributes, setAttributes, context } ) {
	const { values } = attributes;
	const facets = context[ 'hm-facet-blocks/facets' ] || [];
	const orphans = getOrphans( values, facets );

	const innerBlocksProps = useInnerBlocksProps( useBlockProps(), {
		renderAppender: InnerBlocks.DefaultBlockAppender,
	} );

	return (
		<>
			<InspectorControls>
				<PanelBody title={ __( 'Facets', 'hm-facet-blocks' ) }>
					{ orphans.length > 0 && (
						<Notice
							status="warning"
							isDismissible={ false }
							actions={ [
								{
									label: __(
										'Remove these values',
										'hm-facet-blocks'
									),
									onClick: () =>
										setAttributes( {
											values: removeOrphans(
												values,
												facets
											),
										} ),
								},
							] }
						>
							{ sprintf(
								/* translators: %s: comma separated list of "facet: option" pairs. */
								__(
									'This item has values that no longer exist and are ignored on the front end: %s',
									'hm-facet-blocks'
								),
								orphans
									.map(
										( { facet, option } ) =>
											`${ facet }: ${ option }`
									)
									.join( ', ' )
							) }
						</Notice>
					) }

					{ facets.length === 0 && (
						<p>
							{ __(
								'Add facets to the Facet context block first.',
								'hm-facet-blocks'
							) }
						</p>
					) }

					{ facets.map( ( facet ) => (
						<fieldset
							key={ facet.slug }
							className="hm-facet-blocks-item-facet"
						>
							<legend>{ facet.label }</legend>
							{ facet.options.length === 0 && (
								<p>
									{ __(
										'This facet has no options yet.',
										'hm-facet-blocks'
									) }
								</p>
							) }
							{ facet.options.map( ( option ) => (
								<CheckboxControl
									__nextHasNoMarginBottom
									key={ option.slug }
									label={ option.label }
									checked={ (
										values?.[ facet.slug ] || []
									).includes( option.slug ) }
									onChange={ ( isChecked ) =>
										setAttributes( {
											values: toggleValue(
												values,
												facet.slug,
												option.slug,
												isChecked
											),
										} )
									}
								/>
							) ) }
						</fieldset>
					) ) }
				</PanelBody>
			</InspectorControls>
			<div { ...innerBlocksProps } />
		</>
	);
}
