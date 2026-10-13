# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Facet selection block, which lists the selected option of each facet as a button that removes it.
- Facet clear block, a button that sets every facet back to all.

## [0.1.0] - 2026-10-09

### Added

- Facet context block, which holds a list of facets and their options and passes them to the blocks inside it.
- Facet control block, which filters by one facet, shown as buttons or a dropdown.
- Facet item block, a container that shows or hides with the selected options.
- Facet no results block, shown when no item matches.
- The selection is kept in the URL as `facet-<slug>` parameters, and a linked selection is rendered already filtered by the server.
- Removing a facet or option that items use asks whether to clear it from those items. Values left on items are ignored on the front end, reported in the editor and can be removed in one step.
- "Items to show at a time" setting on the Facet context block, and a Facet show more block whose button shows the next batch. The limit counts matching items, so it works with filtering and with a linked selection.

[Unreleased]: https://github.com/humanmade/hm-facet-blocks/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/humanmade/hm-facet-blocks/releases/tag/v0.1.0
