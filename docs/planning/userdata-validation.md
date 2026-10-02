# Userdata and Home validation

## Current development: unified connection and CFG removal

The Unreleased increment adds a single local game/profile discovery and consent flow, confirmed per-file Trash removal and Bind Map category circles with aligned narrow filters. Validation on 2026-10-01: 76 unit tests passed, including canceling consent/selection, multiple-profile choice, missing-userdata continuation, dirty buffers, changed targets and stale snapshots. Extension Host integration passed against synthetic files, including actual CFG removal through the editor Trash API. Home/video/Explorer and Bind Map browser suites passed; filter alignment was checked at 724 and 420 pixels and the 724-pixel capture was inspected. Catalog generation/check, formatting, style and diff checks passed. The real game installation was not edited or executed. No new distribution was generated.

## Compatible refinement for the requested release

Release validation completed on 2026-10-01: `artifacts/cs2-config-tools-1.2.0.vsix` contains the new Explorer, shared finding explanations and Health Check presentation modules, plus the required Home/video assets. Development sources, tests, caches and tooling are excluded. Extension Host integration passed against the extracted VSIX; production Home/video/Explorer browser checks also passed. The local VS Code CLI installed the VSIX successfully and confirmed `plajiw.cs2-config-tools@1.2.0`. Existing packages were preserved; no Marketplace publication or Git tag was performed.

Immutable package reference (SHA-256): `C8FF5E424D8E8277A862D0573BAC11CF25264CEFB0DF80F867BD1A2713ECC42E`. The packaged contents, rather than the uncommitted repository HEAD, define this release baseline.

The user authorized packaging and local installation of this increment as 1.2.0 on 2026-10-01. Home uses source-specific status, contextual profile connection/recovery, collapsed sources/scope disclosures and severity summaries. Saved controls detection opens a regular authorized file as text; crosshair/radar presence refers to direct CFG statements. Video can open in the native editor for manual edits. Command Explorer uses shared registry search and documentation with a normal/full toggle and copying.

Validation covers 73 passing unit tests, including bilingual Health Check grouping, severity, related lines and explained uncertainty; Explorer ranking/visibility, host-owned selection/copy and disposal, actual finding severities and deferred category handling. Chromium covers production Home/video/Explorer pages, contextual connection, source collapse, literal safety, bilingual documentation and typed actions. Extension Host covers connected saved-file identities and Explorer page/picker creation in addition to userdata lifecycle. No game-file writes, automatic profile authorization, game enum verification or global effective-state claims are introduced.

## Previous userdata release

Validated in development on 2026-10-01 on Windows. The increment shipped in the explicitly requested 1.1.0 VSIX. The existing 1.0.0 package is unchanged. The 1.1.0 package was inspected for required runtime assets and development-file exclusions, passed Extension Host integration against its extracted contents and was installed in the local VS Code; the installed extension list confirmed plajiw.cs2-config-tools@1.1.0.

- Unit suite: 63 passing tests, including video arithmetic, literal/unknown fields, duplicate and incomplete input, unsupported structure/escapes, invalid derived numbers, file-name hints and restricted userdata messages.
- Catalog generation and reproducibility passed; source formatting/style and local documentation links passed.
- Production Home and video HTML/assets passed in Chromium with a simulated editor bridge. Checks cover grouped files and excluded totals, removal of duplicate cards, source actions, keyboard activation, focus, English/pt-BR, literal safety, CSP, missing-video state and responsive light/dark Home captures.
- Extension Host integration passed using isolated VS Code 1.96.4. Temporary synthetic files cover profile discovery, independent persistence, read-only inspection, unsaved video buffers, watcher updates, malformed/missing video, unavailable-folder recovery and video page creation. Disk content remains unchanged by inspection. Tests never read or write the game installation.

Name-based grouping does not prove authorship or game management. Video field labels are unverified identifiers from the supplied proposal; no game enum meanings, GPU brand, monitor support or defaults are asserted. Resolution/aspect/frequency are arithmetic derived from literal fields. Game-build/runtime verification, full KeyValues grammar, other userdata domains and video writing remain outside this increment.
