<?php
/**
 * Tests for inc/facets.php.
 */

namespace HM\FacetBlocks\Tests;

use PHPUnit\Framework\TestCase;

use function HM\FacetBlocks\clean_item_values;
use function HM\FacetBlocks\collect_items;
use function HM\FacetBlocks\find_facet;
use function HM\FacetBlocks\get_selected;
use function HM\FacetBlocks\has_more;
use function HM\FacetBlocks\has_results;
use function HM\FacetBlocks\has_selection;
use function HM\FacetBlocks\is_within_limit;
use function HM\FacetBlocks\item_matches;
use function HM\FacetBlocks\sanitize_facets;

class FacetsTest extends TestCase {

	private function facets(): array {
		return [
			[
				'slug'    => 'industry',
				'label'   => 'Industry',
				'options' => [
					[
						'slug'  => 'technology',
						'label' => 'Technology',
					],
					[
						'slug'  => 'retail',
						'label' => 'Retail',
					],
				],
			],
			[
				'slug'    => 'department',
				'label'   => 'Department',
				'options' => [
					[
						'slug'  => 'marketing',
						'label' => 'Marketing',
					],
					[
						'slug'  => 'legal',
						'label' => 'Legal',
					],
				],
			],
		];
	}

	public function test_sanitize_facets_keeps_valid_facets(): void {
		$this->assertSame( $this->facets(), sanitize_facets( $this->facets() ) );
	}

	public function test_sanitize_facets_returns_nothing_for_a_non_array(): void {
		$this->assertSame( [], sanitize_facets( null ) );
		$this->assertSame( [], sanitize_facets( 'industry' ) );
	}

	public function test_sanitize_facets_drops_entries_without_a_slug(): void {
		$facets = sanitize_facets(
			[
				[ 'label' => 'No slug' ],
				'not an array',
				[
					'slug'    => 'industry',
					'options' => [
						[ 'label' => 'No slug' ],
						[ 'slug' => '' ],
						[ 'slug' => 'retail' ],
					],
				],
			]
		);

		$this->assertCount( 1, $facets );
		$this->assertSame( [ 'retail' ], array_column( $facets[0]['options'], 'slug' ) );
	}

	public function test_sanitize_facets_falls_back_to_the_slug_for_a_missing_label(): void {
		$facets = sanitize_facets(
			[
				[
					'slug'    => 'industry',
					'options' => [ [ 'slug' => 'retail' ] ],
				],
			]
		);

		$this->assertSame( 'industry', $facets[0]['label'] );
		$this->assertSame( 'retail', $facets[0]['options'][0]['label'] );
	}

	public function test_sanitize_facets_keeps_the_first_of_a_duplicate_slug(): void {
		$facets = sanitize_facets(
			[
				[
					'slug'    => 'industry',
					'label'   => 'First',
					'options' => [
						[
							'slug'  => 'retail',
							'label' => 'First option',
						],
						[
							'slug'  => 'retail',
							'label' => 'Second option',
						],
					],
				],
				[
					'slug'  => 'industry',
					'label' => 'Second',
				],
			]
		);

		$this->assertCount( 1, $facets );
		$this->assertSame( 'First', $facets[0]['label'] );
		$this->assertSame( [ 'First option' ], array_column( $facets[0]['options'], 'label' ) );
	}

	public function test_find_facet(): void {
		$this->assertSame( 'Department', find_facet( $this->facets(), 'department' )['label'] );
		$this->assertNull( find_facet( $this->facets(), 'removed' ) );
	}

	public function test_clean_item_values_has_a_key_for_every_facet(): void {
		$this->assertSame(
			[
				'industry'   => [ 'retail' ],
				'department' => [],
			],
			clean_item_values( [ 'industry' => [ 'retail' ] ], $this->facets() )
		);
	}

	public function test_clean_item_values_ignores_a_removed_facet(): void {
		$values = clean_item_values(
			[
				'industry' => [ 'retail' ],
				'removed'  => [ 'anything' ],
			],
			$this->facets()
		);

		$this->assertArrayNotHasKey( 'removed', $values );
		$this->assertSame( [ 'retail' ], $values['industry'] );
	}

	public function test_clean_item_values_ignores_a_removed_option(): void {
		$values = clean_item_values(
			[ 'industry' => [ 'removed', 'technology' ] ],
			$this->facets()
		);

		$this->assertSame( [ 'technology' ], $values['industry'] );
	}

	public function test_clean_item_values_handles_malformed_values(): void {
		$empty = [
			'industry'   => [],
			'department' => [],
		];

		$this->assertSame( $empty, clean_item_values( null, $this->facets() ) );
		$this->assertSame( $empty, clean_item_values( [ 'industry' => 'retail' ], $this->facets() ) );
	}

	public function test_get_selected_reads_prefixed_parameters(): void {
		$this->assertSame(
			[
				'industry'   => 'retail',
				'department' => '',
			],
			get_selected( $this->facets(), [ 'facet-industry' => 'retail' ] )
		);
	}

	public function test_get_selected_ignores_unprefixed_and_unknown_values(): void {
		$selected = get_selected(
			$this->facets(),
			[
				'industry'         => 'retail',
				'facet-department' => 'removed',
			]
		);

		$this->assertSame(
			[
				'industry'   => '',
				'department' => '',
			],
			$selected
		);
	}

	public function test_get_selected_ignores_an_array_parameter(): void {
		$selected = get_selected( $this->facets(), [ 'facet-industry' => [ 'retail' ] ] );

		$this->assertSame( '', $selected['industry'] );
	}

	public function test_item_matches_everything_when_nothing_is_selected(): void {
		$selected = get_selected( $this->facets(), [] );

		$this->assertTrue( item_matches( clean_item_values( [], $this->facets() ), $selected ) );
	}

	public function test_item_matches_any_of_its_values_within_a_facet(): void {
		$values = [ 'industry' => [ 'technology', 'retail' ] ];

		$this->assertTrue( item_matches( $values, [ 'industry' => 'retail' ] ) );
		$this->assertTrue( item_matches( $values, [ 'industry' => 'technology' ] ) );
	}

	public function test_item_must_match_every_selected_facet(): void {
		$values = [
			'industry'   => [ 'retail' ],
			'department' => [ 'legal' ],
		];

		$this->assertTrue(
			item_matches(
				$values,
				[
					'industry'   => 'retail',
					'department' => 'legal',
				]
			)
		);
		$this->assertFalse(
			item_matches(
				$values,
				[
					'industry'   => 'retail',
					'department' => 'marketing',
				]
			)
		);
	}

	public function test_item_with_no_value_for_a_facet_only_shows_on_all(): void {
		$values = clean_item_values( [ 'industry' => [ 'retail' ] ], $this->facets() );

		$this->assertTrue(
			item_matches(
				$values,
				[
					'industry'   => 'retail',
					'department' => '',
				]
			)
		);
		$this->assertFalse(
			item_matches(
				$values,
				[
					'industry'   => '',
					'department' => 'legal',
				]
			)
		);
	}

	public function test_collect_items_finds_nested_items_and_skips_nested_contexts(): void {
		$inner_blocks = [
			[
				'blockName'   => 'core/columns',
				'attrs'       => [],
				'innerBlocks' => [
					[
						'blockName'   => 'hm-facet-blocks/item',
						'attrs'       => [ 'values' => [ 'industry' => [ 'retail' ] ] ],
						'innerBlocks' => [],
					],
					[
						'blockName'   => 'hm-facet-blocks/context',
						'attrs'       => [],
						'innerBlocks' => [
							[
								'blockName'   => 'hm-facet-blocks/item',
								'attrs'       => [ 'values' => [ 'industry' => [ 'technology' ] ] ],
								'innerBlocks' => [],
							],
						],
					],
				],
			],
			[
				'blockName'   => 'hm-facet-blocks/item',
				'attrs'       => [],
				'innerBlocks' => [],
			],
		];

		$this->assertSame(
			[
				[
					'industry'   => [ 'retail' ],
					'department' => [],
				],
				[
					'industry'   => [],
					'department' => [],
				],
			],
			collect_items( $inner_blocks, $this->facets() )
		);
	}

	public function test_has_results(): void {
		$items = [
			[
				'industry'   => [ 'retail' ],
				'department' => [],
			],
		];

		$this->assertTrue( has_results( $items, [ 'industry' => 'retail' ] ) );
		$this->assertFalse( has_results( $items, [ 'industry' => 'technology' ] ) );
		$this->assertFalse( has_results( [], [ 'industry' => '' ] ) );
	}

	public function test_has_selection(): void {
		$this->assertFalse(
			has_selection( [
				'industry'   => '',
				'department' => '',
			] )
		);
		$this->assertFalse( has_selection( [] ) );
		$this->assertTrue(
			has_selection( [
				'industry'   => '',
				'department' => 'legal',
			] )
		);
	}

	/**
	 * Five items alternating between technology and retail.
	 */
	private function alternating_items(): array {
		return [
			[ 'industry' => [ 'technology' ] ],
			[ 'industry' => [ 'retail' ] ],
			[ 'industry' => [ 'technology' ] ],
			[ 'industry' => [ 'retail' ] ],
			[ 'industry' => [ 'technology' ] ],
		];
	}

	public function test_every_item_is_within_a_limit_of_zero(): void {
		$items = $this->alternating_items();

		$this->assertTrue( is_within_limit( $items, 4, [ 'industry' => '' ], 0 ) );
	}

	public function test_is_within_limit_counts_items_in_order(): void {
		$items    = $this->alternating_items();
		$selected = [ 'industry' => '' ];

		$this->assertTrue( is_within_limit( $items, 0, $selected, 2 ) );
		$this->assertTrue( is_within_limit( $items, 1, $selected, 2 ) );
		$this->assertFalse( is_within_limit( $items, 2, $selected, 2 ) );
		$this->assertFalse( is_within_limit( $items, 4, $selected, 2 ) );
	}

	public function test_is_within_limit_only_counts_matching_items(): void {
		$items    = $this->alternating_items();
		$selected = [ 'industry' => 'technology' ];

		// The third item is the second technology item.
		$this->assertTrue( is_within_limit( $items, 2, $selected, 2 ) );
		$this->assertFalse( is_within_limit( $items, 4, $selected, 2 ) );
	}

	public function test_has_more_while_matching_items_are_past_the_limit(): void {
		$items = $this->alternating_items();

		$this->assertTrue( has_more( $items, [ 'industry' => '' ], 2 ) );
		$this->assertTrue( has_more( $items, [ 'industry' => '' ], 4 ) );
		$this->assertFalse( has_more( $items, [ 'industry' => '' ], 5 ) );
		$this->assertFalse( has_more( $items, [ 'industry' => '' ], 6 ) );
	}

	public function test_has_more_only_counts_matching_items(): void {
		$items = $this->alternating_items();

		$this->assertTrue( has_more( $items, [ 'industry' => 'technology' ], 2 ) );
		$this->assertFalse( has_more( $items, [ 'industry' => 'retail' ], 2 ) );
	}

	public function test_has_more_is_false_for_a_limit_of_zero(): void {
		$this->assertFalse( has_more( $this->alternating_items(), [ 'industry' => '' ], 0 ) );
	}
}
