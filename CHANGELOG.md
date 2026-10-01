# Changelog

## Unreleased

- Added release-impact guidance and packaging checks for numeric MAJOR.MINOR.PATCH versions and downgrade prevention. These development guardrails apply to future packages; existing VSIX files remain unchanged.

## 0.0.2 — 2026-10-01

- Release packages are now immutable: packaging refuses to overwrite an existing versioned VSIX. Previous artifacts are preserved.

- Redesigned the read-only bind map with reusable, proportional ANSI keyboard and interactive mouse SVGs, category/state filters, a source/history inspector and collapsed analysis details. Added curated category provenance, idle-key inspection, literal-name ambiguity indicators, keyboard activation and responsive theme-aware presentation. No CFG writing is enabled.

- Added a keyboard button in the editor title bar for CS2 CFG documents to open the read-only bind map.

- Added the supplied PNG icon under resources/icons and configured it for the extension listing. Isolated integration extensions to avoid loading the previous publisher's local copy alongside the package being tested.

- Corrected the Marketplace publisher to plajiw and updated formatter examples; integration now reads the extension identifier from the manifest.

- Marked the initial distribution as a preview and verified editor integration with an isolated VS Code host. Corrected the bind-map integration test ordering and added executable/package-path overrides to the test runner.

- Linked the extension to its GitHub repository, homepage and issue tracker; added repository links to the bilingual extension description.

- Hardened bind map navigation against same-version source switches and asynchronous updates; preserved keyboard focus by key and cleared selection when switching sources.
- Added a textual certainty legend, visible key borders and a standalone Chromium smoke check with real keyboard input, reference themes and screenshots. Extension Host validation remains separate.

- Added a read-only visual bind map with reference keyboard, mouse and numpad layouts, all literal keys, source/alias/history navigation, live updates and explicit partial results. Uses the shared effective model and validated WebView messages with scoped resources and CSP.

- Reworked the bilingual READMEs into feature overviews and moved detailed settings/behavior into user guides.

- Added shared repeated/replaced bind analysis with reset and uncertainty boundaries, alias call/definition locations and related diagnostic links.
- Added configurable bind notices and replacement/repetition counts to CFG health reports; no automatic cleanup.

- Reorganized hover into labeled usage fields, enum/boolean meanings and secondary technical/source details, with optional advanced provenance.
- Distinguished written current values from reviewed defaults and observed dump values; improved bilingual viewmodel descriptions.

- Strengthened catalog validation for types, defaults, enums, evidence and compatibility references/cycles.
- Added source trivia, nested statement relationships and order-aware immediate alias resolution.
- Extracted editor-independent localized documentation; examples now come from reviewed metadata and avoid repeating the current assignment.
- Added parameter warnings, bounded local effective-state analysis and alias cycle detection.
- Added document symbols, local references, explicit name quick fixes, optional value inlays and a textual CFG health check.

- Added complete pinned Source 2 ConVar/command discovery, candidate diffs and explicit hash-checked promotion.
- Added a shared command registry, field-level technical/community provenance and normal/advanced completion modes.
- Separated snapshot values, game-build verification and human documentation; retained offline editing.

- Added current crosshair controls, limits, styles and informational hints for hidden historical settings, based on a September 2026 console snapshot.

- Simplified hover documentation and added sourced parameter tables, labeled HUD colors and curated examples.
- Added an opt-in development fetch from the GitHub community inventory API, with review before catalog publication.

- Added CFG document and selection formatting, with configurable blank lines and section separation.
- Separated the language core, VS Code providers, catalog sources, resources and documentation.
- Added source formatting checks, catalog reproducibility checks and contributor/agent guidance.
- Reworked the guides around everyday use and contribution rather than catalog totals.

## 0.0.1 — initial local preview

- Added bilingual community command documentation, completion and hover.
- Added local alias navigation, exec links and syntax diagnostics.
- Added optional crosshair rejection evidence from the supplied console report.

Compatibility with an identified CS2 build and original game help remain under review.
