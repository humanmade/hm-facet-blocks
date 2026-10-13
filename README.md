# HM Facet Blocks

Blocks for filtering content that is already on the page, such as a grid of customer cards filtered by industry and department.

The items are ordinary blocks you write in the editor. Nothing is queried, so the content does not have to be posts. To filter a Query Loop, use [humanmade/query-filter](https://github.com/humanmade/query-filter) instead.

## The blocks

| Block | What it does |
|---|---|
| Facet context (`hm-facet-blocks/context`) | Wraps everything. Holds the list of facets and their options, and remembers what is selected. |
| Facet control (`hm-facet-blocks/control`) | Lets a visitor choose one option of one facet. Shows as buttons or a dropdown. |
| Facet item (`hm-facet-blocks/item`) | A container for any blocks. Shows or hides depending on what is selected. |
| Facet no results (`hm-facet-blocks/no-results`) | A container that only shows when no item matches. |
| Facet show more (`hm-facet-blocks/show-more`) | A button that shows the next batch of items, when the context block limits how many show at a time. |
| Facet selection (`hm-facet-blocks/selection`) | Lists the selected option of each facet as a button that removes it. |
| Facet clear (`hm-facet-blocks/clear`) | A button that sets every facet back to "All". |

Every block but the context block can only be inserted inside a context block. Between them and the context you can use any layout blocks, for example Columns with the controls in one column and a Grid of items in the other.

## Setting it up

1. Insert a Facet context block.
2. In its sidebar, under Facets, add a facet such as "Industry", then add its options.
3. Insert a Facet control and choose the facet it filters. Add one control per facet.
4. Insert Facet item blocks and put your content in them.
5. Select each item and tick the options it belongs to in its sidebar. An item can have several options per facet.

## How items are matched

- A control starts on "All", which shows every item.
- An item matches a facet when the selected option is one of the options ticked on it.
- With more than one facet in use, an item has to match all of them.
- An item with nothing ticked for a facet only shows while that facet is on "All".

## Showing a few items at a time

By default every matching item shows. To show them in batches:

1. Select the Facet context block and set "Items to show at a time" in its sidebar, for example 12.
2. Insert a Facet show more block where the button should go, usually below the items.

The first 12 matching items show, in page order. The button shows the next 12 and hides itself when none are left. Choosing a different option goes back to the first 12.

Every item is still in the page, so the limit does not make the page smaller. How many items a visitor has revealed is not kept in the URL, so a reload or a shared link shows the first batch.

## Showing and clearing what is selected

Insert a Facet selection block to list what a visitor has chosen. It shows one button per facet that has an option selected, with the option's name, such as "Retail". Selecting the button sets that facet back to "All". A screen reader reads each one as "Remove Industry filter: Retail".

Insert a Facet clear block for a button that sets every facet back to "All". Its label is "Clear all filters" unless you change it in the sidebar.

Both blocks hide themselves while nothing is selected. Put them in a Row block to show them side by side.

## The URL

Choosing an option adds a parameter to the URL: `facet-` followed by the facet's slug, for example `?facet-industry=retail&facet-department=legal`. The context block's sidebar shows each facet's parameter name.

A link with these parameters opens already filtered. The server hides the items that do not match, so the right items show before any script runs.

The `facet-` prefix stops a facet called "name" or "author" from colliding with a WordPress query variable.

## Renaming and removing facets

Each facet and option gets a slug when you add it, made from the name you typed. The slug never changes afterwards. Items store slugs, so renaming "Retail" to "Retail and consumer goods" keeps every item's ticks, and existing links keep working.

Removing a facet or option that items still use asks what to do with those items:

- **Remove and clear from items** takes the value off every item that has it.
- **Remove, keep item values** leaves the values stored on the items. They are ignored on the front end. Adding the facet or option back under the same name restores them.

Values left behind this way are reported in two places. The context block's sidebar counts the affected items and offers to remove the values from all of them. Each affected item lists its own in its sidebar.

A control whose facet has been removed shows nothing on the front end, and says so in the editor.

## Styling

The control has plain default styles, each wrapped in `:where()` so a theme selector overrides them without extra specificity.

| Selector | Element |
|---|---|
| `.wp-block-hm-facet-blocks-control.is-display-buttons` | A control shown as buttons |
| `.wp-block-hm-facet-blocks-control.is-display-select` | A control shown as a dropdown |
| `.wp-block-hm-facet-blocks-control__label` | The facet name |
| `.wp-block-hm-facet-blocks-control__option` | One button |
| `.wp-block-hm-facet-blocks-control__option[aria-pressed="true"]` | The selected button |
| `.wp-block-hm-facet-blocks-control__select` | The dropdown |
| `.wp-block-hm-facet-blocks-show-more__button` | The show more button |
| `.wp-block-hm-facet-blocks-selection__option` | One selected option |
| `.wp-block-hm-facet-blocks-selection__option::before` | The mark before a selected option, a multiplication sign by default |
| `.wp-block-hm-facet-blocks-clear__button` | The clear button |

Tabs, pills and similar looks are styles of the buttons display.

The show more button has no styles of its own. It has the `wp-element-button` class, so it takes the theme's button styles.

## Limits

- A visitor can select one option per facet, not several.
- There is no paging. Every item is in the page, including the ones a limit hides.
- Items have to be in the same post content as their context block. An item inside a synced pattern is not supported.
- Two context blocks on one page that both have a facet with the same slug share its URL parameter.

## Requirements

- WordPress 7.1 or later
- PHP 8.2 or later

## Development

```sh
composer install
npm install
npm run build
```

`build/` is not committed. The plugin registers its blocks from it, so build before activating a checkout.

| Command | What it runs |
|---|---|
| `npm start` | Rebuilds on change |
| `composer lint` | PHPCS with the Human Made standard |
| `composer test` | PHPUnit, for the matching rules in `inc/facets.php` |
| `npm run lint:js` and `npm run lint:css` | ESLint and Stylelint |
| `npm run test:unit` | Vitest, for `src/utils` |
| `npm run test:e2e` | Playwright against WordPress Playground |
| `npm run playground:start` | A Playground site with the plugin active and a demo page |

The end to end tests need a browser the first time: `npx playwright install chromium`.

The matching rules exist twice, in `inc/facets.php` for the first response and in `src/utils/matching.js` for the browser. Change both together.

## Releasing

Run the Release workflow from the Actions tab with a version number such as `0.2.0`. It builds the blocks, stamps the version into `hm-facet-blocks.php`, commits that with `build/` to a new `v0.2.0` tag and publishes a GitHub release with the ZIP attached. The release commit is only reachable from the tag, so `main` keeps `__VERSION__` and no build output.

Move the `[Unreleased]` entries in `CHANGELOG.md` under the new version before running it.

## Licence

GPL-2.0-or-later
