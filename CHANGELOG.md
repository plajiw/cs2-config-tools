# Changelog

## Unreleased

## 1.4.1 — 2026-10-02

- Refined Hub spacing, aligned quick/row actions and light-theme status contrast. Video Settings keeps labels, original keys and literal values visible together at narrow widths, with explicit read-only status and secondary scope details.
- Redesigned the Bind Map mouse with mirrored primary buttons, centered wheel and embedded side buttons, retaining shared keyboard/mouse states and literal input identities. Added mouse hit-target checks and real-host dark/light capture coverage for the main screens.
- Reject oversized unsaved builder buffers before copying their text, including during Apply freshness checks; retain secondary styling for destination, remove and cancel actions so the review/apply flow stays prominent.
- Make host acceptance wait for document/watcher notifications, with explicit editor focus, deadlines and exact source/list comparisons. Undo is issued once.

- Automatically recognize CFGs under `game/csgo/cfg` and Steam app `730/local/cfg`, including subfolders, without associating unrelated CFGs or VCFGs. Enable suggestions inside CS2 CFG strings and test direct file opening and bind/command completions in the Extension Host.

## 1.4.0 — 2026-10-02

- Hardened builder previews against destination/session changes and pending cancellation; bounded UTF-8 destination reads while retaining freshness and undo protections.
- Unified ordered alias facts across effective analysis, parameter warnings, inlays, diagnostics and Health; cycle warning totals now agree.
- Reject applicable cross-source constraint conflicts during catalog validation; retain reviewed subsets and explicitly scoped build differences.
- Isolated Windows/browser acceptance resources, preserved primary failures during cleanup, and bounded browser port-file sharing retries.
- Preserved narrow Hub filenames with local table scrolling, bounded/cancelled/deduplicated exec-link I/O, and required reviewed action shapes for complete-action labels.
- Added explicit catalog startup recovery, aligned current features and documented future feature safety gates.
- Added Autoexec Builder MVP in the Hub: structured keyboard/mouse binds, shared action search/validation, explicit conflict replacement, human and raw previews, localized editor edits with undo, exclusive new-file creation and stale buffer/disk protection.
- Added bilingual shared inventory slot meanings and field-level community provenance for Bind Map, hover, completion and builder search; uncertain/mode-dependent semantics remain explicit.

- Recorded the Bind Map visual refinement iterations and real-editor acceptance matrix, including final narrow/medium/wide captures in dark/light themes and local package verification.

## 1.3.0 — 2026-10-02

- Refined Bind Map into dedicated keyboard/mouse sections with a readable fixed-scale keyboard, integrated five-button mouse and adjacent scroll controls. Shared category/state markers, action explanations and a full-width inspector remain consistent across narrow/medium/wide layouts. Added real Extension Development Host visual captures in dark/light themes.

- Recognize `+showscores`, `yaw` and `pitch` in binds, with bilingual descriptions and a pinned CS2 default key-file reference.

- Added a unified local configuration connection flow with game/profile discovery, explicit selection and one combined folder consent. Added per-file CFG removal with confirmation, Trash, dirty-buffer protection and revalidation of file/folder identity. Bind Map preserves category circles for uncertain inputs and aligns Category/State controls at narrow widths.

## 1.2.0 — 2026-10-01

- Refined textual CFG Health Check with severity totals, grouped findings, human explanations shared with diagnostics, source/related lines and explained unresolved effects. Preserves static-analysis scope and selected console-report evidence; no game execution, score or automatic changes.
- Refined Home terminology, severity summaries, category rows and source-specific status. Connected sources and analysis/access notes collapse; direct profile connection/recovery works from Saved Game Settings and video. Added raw video/controls opening in the text editor and watcher reconnection after folder recovery.
- Added Command Explorer in Home and Tools, with offline shared-registry name/description search, normal/full visibility toggle, bilingual shared documentation and copying the selected command name. No command execution or automatic userdata writes.

## 1.1.0 — 2026-10-01

- Grouped game-like CFG names separately from player/unclassified files, excluded that group from Home totals and removed duplicate tool cards. Added independent Steam userdata discovery/consent/persistence and a read-only video view backed by a bounded core parser and definitions with provenance. Preserves unknown/raw fields, derives resolution/aspect/frequency mathematically, includes unsaved buffers and updates on changes. No userdata writes or game enum claims.

## 1.0.0 — 2026-10-01

- Added a Config Hub MVP with native Activity Bar navigation, a responsive Home, explicit folder consent/persistence, Steam library detection, file listing and registry-backed single-file summaries. Existing bind-map and health actions open from the hub; unsaved editor changes are included. Empty CFG creation reviews the destination and refuses overwrites. The menu exposes only implemented tools: bind map, health check and empty CFG creation; future builders stay outside navigation. Home rendering is componentized into tools, overview, quick actions and file list.

## 0.0.4 — 2026-10-01

- Refined bind-map category filtering with an accessible color-coded listbox, lighter keycap/action rows with registry explanations and literal commands, and a distinct CFG source-path badge in the header.
- Clarified release guardrails: versions and packages require an explicit request; the increment is chosen from accumulated changes since the previous release.

## 0.0.3 — 2026-10-01

- Fixed bind-map readability with a fixed-scale horizontally scrollable keyboard, priority-based responsive columns and earlier filter collapse. Compacted the header, aligned the mouse, integrated side buttons, simplified status text/legend and placed catalog meanings before actions in the inspector. Single-assignment histories are hidden; source navigation and uncertainty remain available.

- Added release-impact guidance and packaging checks for numeric MAJOR.MINOR.PATCH versions and downgrade prevention. Existing VSIX files remain unchanged.

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
