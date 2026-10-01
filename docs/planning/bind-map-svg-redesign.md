# Visual bind map: SVG redesign

## Audit before implementation

The effective model records ordered binds, historical replacements and uncertainty. `core/bind-map.ts` projects those results into presentation data; `vscode/bind-map.ts` sends snapshots and validates source navigation against document/panel identity. The WebView is vanilla JavaScript with nonce-protected scripts, scoped resources and literal DOM rendering. Its current canvas is a set of HTML rows, followed by mouse/numpad lists and bind details. It recreates the layout on snapshots and displays analysis limits prominently.

Problems: equal-sized keys lack physical proportions, the numpad/navigation cluster are disconnected from the keyboard, the mouse is not a physical object, unassigned keys cannot be inspected, and warnings dominate the visual hierarchy. Meanings/categories and source history need a stable presentation contract rather than frontend command interpretation.

## Migration

1. Enrich the view model using the shared registry and effective history. Preserve original tokens, source offsets, per-bind certainty and deferred bodies. Add behavioral regressions before presentation changes.
2. Add reusable, data-driven ANSI keyboard/mouse definitions and SVG interaction helpers under `resources/webview/visual-input/`. Visual IDs and CFG tokens remain separate. Layout geometry is a reference, not verified game semantics.
3. Replace the HTML grid with SVG surfaces, a compact header/sidebar, responsive canvas and inspector. Filters only dim physical keys; unmatched literals remain selectable in a list. Selection updates visual states without recreating SVGs.
4. Keep analysis details collapsed, display source/history and catalog descriptions in the inspector, and verify keyboard activation, themes, narrow widths, host integration and packaging.

Existing files: `src/core/bind-map.ts`, `src/vscode/bind-map.ts`, catalog types/source/generator validation where classification metadata is introduced, WebView CSS/controller and unit/browser checks. Added files: visual-input definitions/SVG helpers, view-model/layout regressions and this record. No new framework, dependency, CFG execution or write operations.

Risks: uppercase/unrecognized key literals must not disappear or be normalized as game facts; replacements may be intentional or precede resets; registry descriptions do not prove runtime actions; unknown effects remain partial. The core owns meaning/category/history. UI modules own only geometry, selection and filtering.

First-stage acceptance: enriched projection tests pass for aliases, deferred bodies, historical replacement/reset boundaries, missing metadata and uncertainty; current source-navigation messages remain valid. Final acceptance additionally requires interactive proportioned full-size SVG keyboard, seven mouse regions, shared selection, filters, concise inspector/status, accessible names/focus, four reference themes and distribution checks. Editing remains a future domain-backed capability, not a hidden active control.

## Delivered behavior

The HTML key grid is replaced by SVG keyboard/mouse surfaces, constructed once and updated through shared presentation helpers. All physical inputs can be inspected, including those absent from the analysis. The inspector shows the literal action, available registry summary/category, raw source statement, source line and navigable assignment history. Filters dim geometry; the collapsible literal list preserves names outside the reference and separate case variants. Reassignment is not a game error, and historical changes before resets do not flag the current bind. Analysis details are collapsed. No new dependency, parser, editing message or file-writing behavior is introduced.

The previous requirement that editable CFG fixtures contain only catalog commands was too broad: the current example includes `+showscores`, absent from the reviewed catalog. The regression now explicitly permits its informational unknown-command finding while still rejecting syntax errors and other uncovered names; fixture text and the absence of runtime evidence are preserved.

## Validation

The category-filter refinement adds the reusable category listbox, keycap/action rows and file identity badge. Browser checks cover actual Arrow/Home/End/initial-letter/Enter/Escape/Tab interaction, category color parity with SVG markers, literal row content and the host-provided path. It is included in the explicitly requested distribution; existing artifacts are not regenerated to include these changes.

The readability refinement keeps the keyboard at 1080 pixels and makes only its region scroll horizontally. At 1200 pixels and above the inspector stays beside the canvas; intermediate widths stack it below; widths below 900 collapse filters. The header/legend use concise product text, the mouse aligns left with inset side buttons, and the inspector leads with registry explanations and suppresses one-item history. Scope limitations remain in collapsed details. Specific grenade names are not invented where the registry only documents an inventory slot.

The refinement passes unit/style checks, the isolated Extension Host suite and browser regressions at wide, intermediate and narrow widths. Browser checks additionally confirm local horizontal scrolling, unchanged SVG scale, sidebar collapse, offscreen-key focus visibility, lateral/stacked inspector placement and suppression of single-assignment histories. This is a compatible correction to the existing feature, classified as a patch release.

Source formatting, deterministic catalog checks and unit regressions pass. The real Chromium DOM runner checks SVG key/mouse counts, idle selection, filters that preserve geometry, shared mouse selection, source/history messages, Enter/Space/Tab, snapshot focus, literal text injection safety, source switch/close, CSP and narrow layout. It captures dark, light, high-contrast dark and high-contrast light references under `.test-output/bind-map-browser/`. Geometry tests check unique IDs, physical proportions, numpad position and overlapping bounds. Host tests cover stale locations, lifecycle and recovery after analysis failure.

The isolated official VS Code 1.96.4 Extension Host suite passes against both the source build and the extracted VSIX. Packaging includes all visual-input modules and excludes development/cache files. The rebuilt VSIX is installed locally; reload the editor window to refresh the running extension. These checks do not verify CS2 runtime effects or replace screen-reader and theme review in every editor installation. The local fixtures and existing manifest edits are preserved; the README overviews remain unchanged at the user's earlier request.
