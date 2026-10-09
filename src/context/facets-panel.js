import {
	Button,
	Flex,
	FlexBlock,
	FlexItem,
	Modal,
	Notice,
	TextControl,
} from '@wordpress/components';
import { useState } from '@wordpress/element';
import { __, _n, sprintf } from '@wordpress/i18n';

import {
	createSlug,
	getOrphans,
	removeFromValues,
	removeOrphans,
	usesFacet,
} from '../utils/facets';

// Matches QUERY_PREFIX in inc/facets.php.
const QUERY_PREFIX = 'facet-';

/**
 * A text field and a button that adds what was typed.
 *
 * @param {Object}   props
 * @param {string}   props.label       Field label.
 * @param {string}   props.buttonLabel Button text.
 * @param {Function} props.onAdd       Receives the trimmed text.
 */
function AddForm( { label, buttonLabel, onAdd } ) {
	const [ value, setValue ] = useState( '' );
	const trimmed = value.trim();

	const submit = () => {
		if ( ! trimmed ) {
			return;
		}

		onAdd( trimmed );
		setValue( '' );
	};

	return (
		<Flex align="flex-end" className="hm-facet-blocks-add-form">
			<FlexBlock>
				<TextControl
					__next40pxDefaultSize
					__nextHasNoMarginBottom
					label={ label }
					value={ value }
					onChange={ setValue }
					onKeyDown={ ( event ) => {
						if ( event.key === 'Enter' ) {
							event.preventDefault();
							submit();
						}
					} }
				/>
			</FlexBlock>
			<FlexItem>
				<Button
					__next40pxDefaultSize
					variant="secondary"
					onClick={ submit }
					disabled={ ! trimmed }
					accessibleWhenDisabled
				>
					{ buttonLabel }
				</Button>
			</FlexItem>
		</Flex>
	);
}

/**
 * Asks what to do with the items that still use a facet or option being
 * removed.
 *
 * @param {Object}   props
 * @param {Object}   props.pending  The removal: `{ label, isOption, uses }`.
 * @param {Function} props.onRemove Receives whether to clear the values from items.
 * @param {Function} props.onCancel Closes the dialog.
 */
function RemovalDialog( { pending, onRemove, onCancel } ) {
	const message = pending.isOption
		? /* translators: %d: number of item blocks. */
			_n(
				'%d item uses this option.',
				'%d items use this option.',
				pending.uses,
				'hm-facet-blocks'
			)
		: /* translators: %d: number of item blocks. */
			_n(
				'%d item uses this facet.',
				'%d items use this facet.',
				pending.uses,
				'hm-facet-blocks'
			);

	return (
		<Modal
			title={ sprintf(
				/* translators: %s: facet or option label. */
				__( 'Remove "%s"?', 'hm-facet-blocks' ),
				pending.label
			) }
			onRequestClose={ onCancel }
			size="medium"
		>
			<p>{ sprintf( message, pending.uses ) }</p>
			<p>
				{ __(
					'Clearing it from those items cannot be reversed by adding it back. If you keep the values, they are ignored on the front end, and adding it back under the same name restores them.',
					'hm-facet-blocks'
				) }
			</p>
			<Flex justify="flex-end" wrap>
				<Button
					__next40pxDefaultSize
					variant="tertiary"
					onClick={ onCancel }
				>
					{ __( 'Cancel', 'hm-facet-blocks' ) }
				</Button>
				<Button
					__next40pxDefaultSize
					variant="secondary"
					onClick={ () => onRemove( false ) }
				>
					{ __( 'Remove, keep item values', 'hm-facet-blocks' ) }
				</Button>
				<Button
					__next40pxDefaultSize
					variant="primary"
					onClick={ () => onRemove( true ) }
				>
					{ __( 'Remove and clear from items', 'hm-facet-blocks' ) }
				</Button>
			</Flex>
		</Modal>
	);
}

/**
 * The facet editor in the context block's sidebar.
 *
 * @param {Object}   props
 * @param {Array}    props.facets      Facet definitions.
 * @param {Array}    props.items       The context's items: `{ clientId, values }`.
 * @param {Function} props.onChange    Receives the new facet definitions.
 * @param {Function} props.updateItems Rewrites every item's values with a callback.
 */
export default function FacetsPanel( {
	facets,
	items,
	onChange,
	updateItems,
} ) {
	const [ pending, setPending ] = useState( null );

	const updateFacet = ( facetSlug, changes ) =>
		onChange(
			facets.map( ( facet ) =>
				facet.slug === facetSlug ? { ...facet, ...changes } : facet
			)
		);

	const remove = ( facetSlug, optionSlug, clearItems ) => {
		if ( clearItems ) {
			updateItems( ( values ) =>
				removeFromValues( values, facetSlug, optionSlug )
			);
		}

		if ( optionSlug === undefined ) {
			onChange( facets.filter( ( { slug } ) => slug !== facetSlug ) );
		} else {
			const facet = facets.find( ( { slug } ) => slug === facetSlug );

			updateFacet( facetSlug, {
				options: facet.options.filter(
					( { slug } ) => slug !== optionSlug
				),
			} );
		}

		setPending( null );
	};

	const requestRemoval = ( facet, option ) => {
		const uses = items.filter( ( { values } ) =>
			usesFacet( values, facet.slug, option?.slug )
		).length;

		if ( ! uses ) {
			remove( facet.slug, option?.slug, false );
			return;
		}

		setPending( {
			facetSlug: facet.slug,
			optionSlug: option?.slug,
			isOption: !! option,
			label: ( option || facet ).label,
			uses,
		} );
	};

	const moveOption = ( facet, index, offset ) => {
		const options = [ ...facet.options ];
		const [ moved ] = options.splice( index, 1 );

		options.splice( index + offset, 0, moved );
		updateFacet( facet.slug, { options } );
	};

	const orphanedItems = items.filter(
		( { values } ) => getOrphans( values, facets ).length
	).length;

	return (
		<div className="hm-facet-blocks-facets">
			{ orphanedItems > 0 && (
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
								updateItems( ( values ) =>
									removeOrphans( values, facets )
								),
						},
					] }
				>
					{ sprintf(
						/* translators: %d: number of item blocks. */
						_n(
							'%d item has values for a facet or option that no longer exists. They are ignored on the front end.',
							'%d items have values for a facet or option that no longer exists. They are ignored on the front end.',
							orphanedItems,
							'hm-facet-blocks'
						),
						orphanedItems
					) }
				</Notice>
			) }

			{ facets.length === 0 && (
				<p>
					{ __(
						'Add a facet, such as Industry, then add its options.',
						'hm-facet-blocks'
					) }
				</p>
			) }

			{ facets.map( ( facet ) => (
				<fieldset key={ facet.slug } className="hm-facet-blocks-facet">
					<legend className="screen-reader-text">
						{ facet.label }
					</legend>
					<TextControl
						__next40pxDefaultSize
						__nextHasNoMarginBottom
						label={ __( 'Facet name', 'hm-facet-blocks' ) }
						help={ sprintf(
							/* translators: %s: URL parameter name. */
							__( 'URL parameter: %s', 'hm-facet-blocks' ),
							QUERY_PREFIX + facet.slug
						) }
						value={ facet.label }
						onChange={ ( label ) =>
							updateFacet( facet.slug, { label } )
						}
					/>

					<ul className="hm-facet-blocks-facet__options">
						{ facet.options.map( ( option, index ) => (
							<li key={ option.slug }>
								<Flex gap={ 1 }>
									<FlexBlock>
										<TextControl
											__next40pxDefaultSize
											__nextHasNoMarginBottom
											label={ __(
												'Option name',
												'hm-facet-blocks'
											) }
											hideLabelFromVision
											value={ option.label }
											onChange={ ( label ) =>
												updateFacet( facet.slug, {
													options: facet.options.map(
														( current ) =>
															current.slug ===
															option.slug
																? {
																		...current,
																		label,
																	}
																: current
													),
												} )
											}
										/>
									</FlexBlock>
									<FlexItem>
										<Button
											size="small"
											icon="arrow-up-alt2"
											label={ sprintf(
												/* translators: %s: option label. */
												__(
													'Move %s up',
													'hm-facet-blocks'
												),
												option.label
											) }
											disabled={ index === 0 }
											accessibleWhenDisabled
											onClick={ () =>
												moveOption( facet, index, -1 )
											}
										/>
										<Button
											size="small"
											icon="arrow-down-alt2"
											label={ sprintf(
												/* translators: %s: option label. */
												__(
													'Move %s down',
													'hm-facet-blocks'
												),
												option.label
											) }
											disabled={
												index ===
												facet.options.length - 1
											}
											accessibleWhenDisabled
											onClick={ () =>
												moveOption( facet, index, 1 )
											}
										/>
										<Button
											size="small"
											icon="trash"
											isDestructive
											label={ sprintf(
												/* translators: %s: option label. */
												__(
													'Remove %s',
													'hm-facet-blocks'
												),
												option.label
											) }
											onClick={ () =>
												requestRemoval( facet, option )
											}
										/>
									</FlexItem>
								</Flex>
							</li>
						) ) }
					</ul>

					<AddForm
						label={ __( 'New option', 'hm-facet-blocks' ) }
						buttonLabel={ __( 'Add option', 'hm-facet-blocks' ) }
						onAdd={ ( label ) =>
							updateFacet( facet.slug, {
								options: [
									...facet.options,
									{
										slug: createSlug(
											label,
											facet.options.map(
												( { slug } ) => slug
											)
										),
										label,
									},
								],
							} )
						}
					/>

					<Button
						variant="tertiary"
						isDestructive
						onClick={ () => requestRemoval( facet ) }
					>
						{ sprintf(
							/* translators: %s: facet label. */
							__( 'Remove the %s facet', 'hm-facet-blocks' ),
							facet.label
						) }
					</Button>
				</fieldset>
			) ) }

			<AddForm
				label={ __( 'New facet', 'hm-facet-blocks' ) }
				buttonLabel={ __( 'Add facet', 'hm-facet-blocks' ) }
				onAdd={ ( label ) =>
					onChange( [
						...facets,
						{
							slug: createSlug(
								label,
								facets.map( ( { slug } ) => slug )
							),
							label,
							options: [],
						},
					] )
				}
			/>

			{ pending && (
				<RemovalDialog
					pending={ pending }
					onRemove={ ( clearItems ) =>
						remove(
							pending.facetSlug,
							pending.optionSlug,
							clearItems
						)
					}
					onCancel={ () => setPending( null ) }
				/>
			) }
		</div>
	);
}
