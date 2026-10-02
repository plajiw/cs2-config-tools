# CS2 Config Tools — Full Project Audit

Audit date: 2026-10-02, America/Sao_Paulo. Analysis only. No application fixes, catalog promotion, release, installation, game execution or publication were performed by this audit.

## 1. Executive Summary

**HEALTHY WITH CORRECTIONS.** The current architecture is clean enough for incremental development. There is no demonstrated need for a language server, monorepo, replacement parser, new domain directory hierarchy or enterprise service layer. The existing registry, core and editor adapter boundaries should be preserved.

The strongest foundations are shared command lookup, separate technical and editorial evidence, conservative formatting, bounded single-file effective analysis, and WebViews that consume host models instead of interpreting CFG themselves. These strengths follow from tracing the implementation, not just from successful tests.

The most important correction is in the newly arriving Autoexec Builder: changing its destination through `show(uri)` retains a preview for the previous file. Alias interpretation also differs between parameter checks, diagnostics and effective-state analysis. Catalog validation does not reject a demonstrated conflict between curated and technical ranges. Narrow Hub rendering makes even short filenames difficult to recognize.

These are localized correctness, safety and UX problems. They do not justify an architectural rewrite. Continue development after correcting the builder destination invariant; address analysis and metadata consistency before expanding builders or using analysis to automate migration.

### Top five technical risks

1. **WRITE-001:** a builder preview can remain authorized for a different destination from the one currently displayed.
2. **ANALYSIS-001:** different alias interpretations produce missed value warnings and false unknown-command findings.
3. **DATA-001:** conflicting curated/technical constraints can survive validation and then be resolved silently by consumer precedence.
4. **PERF-001 / WRITE-002:** document links fan out filesystem requests without a concurrency bound; builder disk reads are unbounded before source-size validation.
5. **VERIFY-001:** the observed integration runner failures prevent a clean end-to-end acceptance result, despite useful unit and visual evidence.

### Top five strengths to retain

1. Editor-independent `CommandRegistry`, documentation and analysis.
2. Pinned two-dump import, explicit reviewed promotion, hashes and deterministic catalog checks.
3. Original help, community wording, observed dump values, defaults, lifecycle and runtime verification are distinct concepts.
4. Source offsets, original text, deferred-body parent links, order and conservative formatter behavior.
5. Typed/validated host message boundaries, restrictive CSP, literal DOM rendering and stale-source protections in the Bind Map.

## 2. Scope

### Repository and evidence boundary

The Git HEAD observed was `e5ba1fbd16405e2298d8ea301a75e45dc688eaae`. The audited subject is the **working tree**, including pre-existing modified and untracked files, not only that commit and not an existing VSIX.

The working tree changed during the review. In particular, the Autoexec Builder adapter, assets, tests, registration and documentation arrived while inspection was underway; some initial compiler errors, catalog drift and a unit assertion were subsequently changed outside this audit. Initial failures below are historical observations, not claims that those transient failures remain in the final source. Findings identify functions as well as paths because formatting changed line numbers during review. Reconfirm a finding against its cited function before implementing it.

Reviewed areas:

- Orientation: `README.md`, `CONTRIBUTING.md`, `AGENTS.md`, `FEATURES.md`, `PROJECT_VISION.md`, architecture, status, roadmap, implementation plan, data sources, command database and bilingual guides.
- Metadata: `src/catalog/`, source JSON, generated catalog, `build-catalog.cjs`, technical attachment/validation, Source 2 parser, fetch and promotion scripts.
- Language/domain: parser, completion context, formatter, parameters, diagnostics, effective state, binds, documentation, human meaning, health/presentation, bind map, workspace summaries, video and builder preview/edits.
- Editor: activation, services/cache, providers, completion, navigation, diagnostics, formatting, inlays, health, Bind Map, Hub, folder/connection/userdata handling, Command Explorer and the new builder adapter.
- Presentation: production WebView HTML, JS/CSS and reusable visual-input components; browser tests, host capture scripts, unit/integration tests, CI, package guard and exclusion rules.

This was not a line-by-line verification of every imported catalog description or every planned interface in the master specification. No current upstream snapshot was fetched or promoted. No claim about game acceptance, key case equivalence, inventory availability or command replacements was independently runtime-verified.

### Checks and execution results

The local Node toolchain was found under the project's local application-data toolchain directory. Node was `v22.23.3`; `npm` was initially unavailable on the inherited PATH. Commands used a temporary process PATH, without changing machine configuration.

| Check                                  | Observed result and meaning                                                                                                                                                                                                                                        |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `npm test`, initial                    | Stopped at `catalog:check`: catalog stale. No regeneration was performed by the auditor.                                                                                                                                                                           |
| `npm run build`, initial builder state | Type errors from QuickPick items using the reserved `kind` field as a string discriminator. Later source used `destinationKind`; a subsequent build completed.                                                                                                     |
| Direct unit suite, initial             | 78/78 passed on emitted modules. This bypassed the failed catalog/build gate and was explicitly not a full acceptance pass.                                                                                                                                        |
| Later build and `catalog:check`        | Completed; catalog was up to date after outside working-tree changes.                                                                                                                                                                                              |
| Later direct unit suite                | 84/85 passed; Bind Map expected a long Portuguese description but received the new short label. The assertion was subsequently updated outside this audit.                                                                                                         |
| Final `npm test` rerun                 | Passed with catalog check, build and 85/85 unit tests (exit 0). This resolves the earlier pipeline failures for that observed working-tree state; the independently reproduced findings remain untested invariants.                                                |
| `npm run check:style`                  | Initially failed in eight files; an intermediate run failed in sixteen while builder work arrived. The final check failed only in `src/vscode/autoexec-builder.ts` (exit 1). No application write-formatting was run.                                              |
| Bind Map browser runner                | First attempt failed with `EBUSY` reading Chromium's `DevToolsActivePort`; retry passed. Real DOM, keyboard interaction, CSP, literal injection payload, reference themes and responsive layout were exercised.                                                    |
| Hub browser runner                     | Passed on production renderer with a simulated editor bridge; dark/light and wide/narrow screenshots were reviewed.                                                                                                                                                |
| `npm run test:integration`             | Two attempts failed to deliver the success marker. Logs showed a VS Code mutex error and `ENOTEMPTY` during synthetic-folder cleanup; the second runner also timed out and failed to kill its process with access denied. This is not a passing integration suite. |
| Real Bind Map host capture             | Passed in isolated VS Code 1.96.4, with measured WebView widths 1872, 1152 and 852 pixels. Actual screenshots were inspected.                                                                                                                                      |
| Package file list                      | `vsce ls` inspected the candidate file set without generating a VSIX. Runtime modules, catalog and WebView assets were included; source data, tests, fixtures and caches were excluded.                                                                            |
| `npm run package`                      | Intentionally not run. `AGENTS.md` requires an explicit release request; this analysis task does not authorize generating a distribution. Package guards and candidate contents were inspected instead.                                                            |

The browser runners were invoked directly after the available build to separate renderer evidence from the changing build gate. This is narrower evidence than successful execution of every npm wrapper on one immutable snapshot.

Local logs and screenshots remain in ignored `.test-output/`; these are review artifacts, not new application source. Fixtures were read and copied to synthetic test locations, never executed or modified by the auditor.

### Screens actually reviewed

- Hub: [dark wide](../../.test-output/config-hub-browser/dark-1440.png) and [light narrow](../../.test-output/config-hub-browser/light-420.png), generated this review.
- Bind Map browser: [desktop](../../.test-output/bind-map-browser/desktop.png) and [narrow](../../.test-output/bind-map-browser/narrow.png), plus production renderer assertions for reference themes and intermediate widths.
- Bind Map real host: [wide selected](../../.test-output/bind-map-host-lQRRED/wide-selected.png), [medium](../../.test-output/bind-map-host-lQRRED/medium.png), [narrow selected](../../.test-output/bind-map-host-lQRRED/narrow-selected.png), and [measurements](../../.test-output/bind-map-host-lQRRED/measurements.json).

The real-host fixture combines the existing `autoexec.cfg` with synthetic mouse/reassignment/unresolved-exec additions in a separate file. The browser fixture uses representative literal/unknown input names, reassignments and an HTML-looking string. No real game installation was used for editor testing.

Hub visual acceptance is based on browser rendering, not a completed real-host Hub session. Command Explorer and Video Settings received source/security/model review, but no independent screenshot acceptance of their actual host screens. The new builder received source and preview tests; no completed builder host visual acceptance is claimed by this audit.

## 3. Architecture

### Positive assessment

`src/extension.ts` wires activation. `createServices` owns one activation's catalog/registry and document-version cache. Core and catalog modules do not import VS Code. The Hub delegates file access to folder/userdata adapters and CFG summaries to core services. The Bind Map consumes `effectiveConfig` through `bindMapModel`; it does not evaluate commands in JavaScript.

No concrete cross-layer dependency or circular runtime dependency requiring a reorganization was identified in the reviewed paths. Type relationships between findings and parameter/bind analysis do not, by themselves, justify moving files. Long modules such as the Hub orchestrator are not defects simply because they are long.

### ARCH-001 — Recoverable catalog startup failure is not handled locally

- **Severity:** Low.
- **Area / evidence:** `src/vscode/services.ts`, `createServices`: synchronous `readFileSync`, `JSON.parse`, then `new CommandRegistry`; `src/extension.ts`, `activate`, has no local recovery/reporting branch.
- **Finding / impact:** missing or malformed packaged catalog aborts activation before provider registration. VS Code can report an extension activation error, but the extension offers no specific recovery explanation. This is a packaging/corruption failure path, not evidence of ordinary runtime instability.
- **Recommendation:** add a clear activation error identifying the catalog problem and reinstall/rebuild recovery. Do not silently create an empty registry and present incomplete analysis as normal. Keep comprehensive validation in the build pipeline; a second runtime database is unnecessary.
- **Acceptance:** missing JSON, malformed JSON and duplicate symbol activation cases fail visibly without misleading editor results.

## 4. Domain Model

The models represent command kind, lifecycle, evidence, token/source location, certain values, invocation provenance, bind changes, execution history and analysis limits explicitly. Strings for command names and parameter literals are appropriate for an open console language; branded primitives are not currently justified by a demonstrated bug.

The new `humanMeaning` helper is a shared consumer of editorial metadata, not another command database. The reviewed inventory-slot labels live in source JSON and flow into documentation, completion, map and builder search. Broader action signatures and contexts remain partial. The metadata's `community` confidence and lack of game verification must remain visible when interpreting these labels.

### DOMAIN-001 — Bind action labels ignore the action's arguments

- **Severity:** Low.
- **Area / evidence:** `src/core/bind-map.ts`, `bindMapModel`: a one-statement body selects its first token's registry entry and then calls `humanMeaning`, without checking remaining arguments. `src/core/bind-builder.ts` separately rejects arguments for inventory-slot meanings.
- **Reproduction:** `bind x "slot8 unexpected"` produces the label `Smoke Grenade`, with no parameter finding, while the builder rejects the corresponding parameterized action.
- **Impact:** the label describes a recognized command rather than establishing the meaning/validity of the entire action. A user may interpret the human label as validation of the full literal bind.
- **Recommendation:** use the same narrow action-shape rule for reviewed inventory-slot labels wherever the complete action is being explained. Preserve the raw body and fall back to command documentation/unknown action when shape cannot be established. Do not invent game argument semantics.
- **Acceptance:** literal `slot8` retains its reviewed label; unexpected arguments and command chains retain raw content without a confidently resolved whole-action label.

## 5. Command Registry / Data Pipeline

The implemented flow is explicit collection → candidates/raw hashes/diff → reviewed promotion → technical source + separate curated JSON → validated generated catalog → registry → consumers. Both dumps are pinned to one SHA. Promotion checks the requested revision, raw hashes and reparsed entries. Missing names are reported as missing, not marked removed automatically.

Field provenance distinguishes technical facts from editorial text and parameter information. `dumpValue` is not inferred as a default. Hidden/development/cheat flags do not determine lifecycle. `gameBuild: null` and `verifiedInGame: false` correctly preserve missing verification. Original English help is separate from localized community descriptions.

Normal completion filters explicit hidden/internal/development flags through the registry; advanced lookup can expose the wider catalog. Consumers should keep this policy rather than duplicating visibility rules.

### DATA-001 — Validation does not reconcile conflicting constraint sources

- **Severity:** Medium.
- **Area / evidence:** `scripts/lib/validate-catalog.cjs`, `validateCatalog` validates `parameter` in isolation and checks technical source/kind, but does not compare parameter constraints/defaults with technical bounds. `src/core/parameters.ts` and `documentation.ts` select `technical.min/max ?? parameter.min/max`.
- **Reproduction:** clone the generated catalog in memory; select an entry having a technical minimum and curated parameter metadata (observed: `cl_crosshair_drawoutline`). Replace its parameter with `type: number`, `min: technical.min - 2`, `max: technical.min - 1`, `default: String(technical.min - 1)`. `validateCatalog` accepts it, despite the curated allowed range/default being wholly below the technical minimum.
- **Impact:** contradictory evidence survives the pipeline; documentation/validation silently favor one source. An impossible default can appear alongside a different effective allowed range. The claim that unresolved data conflicts are rejected is therefore only partially implemented.
- **Recommendation:** validate applicable cross-source constraints before generation succeeds. Distinguish a deliberately scoped/reviewed curated subset from an unresolved contradiction; reject disjoint same-context ranges and defaults incompatible with the effective constraints unless a scoped resolution is explicitly recorded. Do not equate legitimate differing build contexts automatically.
- **Acceptance:** invalid-data tests cover disjoint ranges, conflicting defaults/enums, scoped differences and deterministic generation. The conflict must fail before published JSON changes.

Lifecycle/provenance modeling is a useful current foundation, not a complete historical migration model. Build applicability and proven parameter transformations must be added only when evidence exists. Current compatibility metadata is not a license to automatically rewrite values.

## 6. Parser / Source Model

`parse` is a deterministic character scanner for the documented subset: literal quoted tokens, comments outside quotes, semicolon/newline separation, whitespace and physical-line recovery for incomplete quotes. It tracks token/content offsets, statement context, deferred-body parent starts, original source and trivia. Bind/alias bodies are inspected without becoming immediate top-level execution.

Unquoted bind actions, quoted multi-command bodies, quoted comment/semicolon text, CRLF, BOM, malformed strings and formatter idempotence have behavioral coverage. Backslash escapes are deliberately not inferred; this is an explicit unsupported grammar assumption, not a discovered game defect.

The source-preservation foundation **partially exists** and is sufficient for narrow token-local edits. The formatter is intentionally separate from a semantic writer and returns malformed quoted text unchanged. A complete CST rewrite is not currently justified: original text plus verified localized edits already preserves unrelated content. Broader editing requires additional acceptance tests for trivia ownership, nesting, unsupported grammar, encoding and stale snapshots before expanding operations.

Deferred-body parsing has a depth cap. Effective alias expansion has separate cycle/operation limits. Future tools must not assume a flat list is a complete execution trace merely because nested statements are available.

No parser replacement is recommended from this audit.

## 7. Static Analysis

The effective engine correctly preserves written order, deferred bind bodies, immediate alias invocation, literal assignments, unbind/unbindall and history. The demonstrated bind cases behave correctly:

| Input sequence                     | Effective literal action | Classification                  |
| ---------------------------------- | ------------------------ | ------------------------------- |
| `bind x slot8` then `bind x slot7` | `slot7`                  | `overwritten`                   |
| `bind x slot8` twice               | `slot8`                  | `redundant`                     |
| reset/unbind followed by a bind    | Later explicit bind      | Separate uninterrupted sequence |

Unknown effects and unresolved execs make results partial and invalidate prior certainty. Later explicit literal writes can restore certainty for that modeled value; `complete` remains false. This is a bounded model, not proof of game execution or absence of external aliases/context restrictions.

### ANALYSIS-001 — Alias interpretation differs between analysis consumers

- **Severity:** Medium.
- **Area / evidence:** `src/core/parameters.ts`, `parameterFindings`, uses the complete document's `aliases(parsed)` map; `src/core/diagnostics.ts`, `analyze`, uses textual definitions and deferred scopes; `src/core/effective.ts`, `effectiveConfig`, expands immediately invoked aliases in order. `src/vscode/inlays.ts` also uses the complete alias map. `src/core/health.ts` composes findings without converting alias-cycle limits as the diagnostics adapter does.
- **Reproduction A:** `cl_hud_color 99` followed by `alias cl_hud_color "echo hi"` yields no parameter warning for the earlier value. Removing the later alias yields the expected invalid-enum warning. The later definition suppresses validation retroactively.
- **Reproduction B:** `alias create "alias later echo"`, then `create`, then `later` yields `complete: true` in effective state, but diagnostics/health mark `later` unknown.
- **Reproduction C:** `alias loop "loop"` then `loop` gives an alias-cycle limit and an editor warning, but `healthReport(...).findings` is empty. The textual report does explain the unresolved cycle separately; it does not hide the limit, but its findings/warning totals differ.
- **Impact:** the same file can have missed warnings, false unknown-name notices and inconsistent severity summaries. These matter when a builder or doctor relies on analysis to explain changes.
- **Recommendation:** reuse an ordered alias-resolution result for immediate statements; keep deferred uses explicitly document-scoped/uncertain. Derive cycle findings through a shared core helper so health and editor diagnostics apply the same rule. Do not turn every deferred alias into an immediately executed definition, and do not rewrite the whole engine merely to merge functions.
- **Acceptance:** regressions cover before/after shadowing, invoked alias creation, redefinition, queries, deferred use, cycles and consistent findings across health/editor consumers.

Exec navigation resolves filenames, but the effective model deliberately does not load those files. Missing exec targets and cycles between files are not currently modeled. That declared limitation is appropriate until workspace execution is implemented.

## 8. VS Code Providers

Hover, completion, diagnostics, formatting, navigation, symbols, links and optional inlays are implemented. Colors and CodeLens are not registered as dormant features. Providers share parsing/cache and registry access; formatter reparsing serves a different operation and is not an independent command database.

Hover uses domain documentation blocks, safely rendered Markdown, current arguments, known defaults/ranges, reviewed examples and separate observed values. Enum/boolean labels come from registry metadata. Original/help and source details are available. Quick fixes replace only explicit diagnostic name ranges, rather than silently migrating commands.

Completion supports command prefixes, bind-body commands, bind keys, buy literals, exec examples, toggle ConVars, aliases and reviewed values. Some key/buy/exec suggestion lists remain provider-local observed examples. Those lists are not validated exhaustive signatures. Move facts to shared data only when another implemented consumer needs the same fact or a discrepancy is demonstrated; do not create an extra action registry solely to relocate arrays.

Alias navigation distinguishes immediate redefinitions, while deferred use resolves at document scope. Cross-file references remain planned. Cancellation exists on async definition/links and formatting paths, but document links check it after all requests complete; see PERF-001.

Diagnostic defaults avoid treating every unknown name or reassignment as a warning. Syntax errors are errors; constrained value problems are warnings; unknowns and bind observations default to information. The optional console report is scoped and disabled by default. No general warning-fatigue defect was established, though the alias inconsistency produces avoidable noise.

## 9. Configuration Hub

The Hub orchestrates existing domain services. Its overview sums independent file summaries and explicitly separates saved video settings; it does not invent combined CFG/userdata effective state. It includes unsaved buffers, generation checks, a capped top-level file list, heuristic grouping, recovery paths and explicit creation/removal actions.

Wide screenshots communicate files and quick actions clearly. Game-like files and connection details are collapsed, and disconnected/unavailable state has actionable recovery. Native sidebar navigation is appropriate. The overview's zero settings with partial files is not game state; the nearby scope explanation correctly limits that claim.

### UX-001 — Narrow Hub table sacrifices file identity to fit

- **Severity:** Medium.
- **Area / evidence:** `resources/webview/config-hub.css`, table/file-link styles and narrow media query; current [light 420px capture](../../.test-output/config-hub-browser/light-420.png).
- **Finding:** `autoexec.cfg` wraps into `autoe` / `xec.c` / `fg`; `practice.cfg` similarly breaks across several lines. Actions consume a large portion of each row. The no-overflow browser assertion passes, but filenames are harder to recognize and compare.
- **Impact:** selecting the correct file is a primary Hub task. Layout correctness measured as “fits the viewport” misses a practical readability failure.
- **Recommendation:** preserve recognizable filenames at narrow widths, using a deliberate table minimum width with local scrolling or a compact row layout. Keep actions associated with their file and keyboard-accessible. Either implementation is acceptable if it solves the observed recognition problem.
- **Acceptance:** review long/short filenames at 420px and intermediate panel widths, in dark/light themes. Assert or manually verify filename readability in addition to page overflow.

Repeated New CFG access in quick actions and the file-section heading is a contextual shortcut, not sufficient evidence of a product defect. Card styling alone does not justify redesigning the Home.

## 10. Visual Bind Map

The renderer is read-only and consumes shared effective state and human explanations. It offers ANSI geometry, numpad, mouse buttons/wheel, literal unknown inputs, filters, state distinctions, inspector, history and source navigation. The host validates snapshot, document version, indices and navigation targets; it rechecks source identity after asynchronous editor opening.

Visual observations from real host captures:

- At wide width, keyboard and mouse fit beside each other; the inspector spans below them. Keyboard labels remain legible and mouse M1–M5 belong to recognizable regions.
- At medium width the keyboard scrolls locally, mouse moves below it, and page overflow measurements remain false.
- At narrow host width, filters collapse; selected mouse details remain readable. The inspector is below the full device area, so selection can require vertical movement, but the focus transition makes it reachable. This is a tradeoff, not a demonstrated need to move it.
- The 420px browser view preserves key size rather than shrinking labels. Horizontal movement is local to the keyboard and offscreen key focus reveals the key.
- Assigned category dots survive uncertainty. Dashed borders and explicit status text distinguish uncertainty from no data, instead of depending solely on color.
- A selected literal HTML-looking action is rendered as text; it does not become an image or executable markup.

The screenshots support a coherent UI; they do not prove task completion speed, screen-reader quality or compatibility with every theme/layout. High-contrast reference assertions were exercised, but no full assistive-technology study was conducted. DOM/model coverage is stronger than a mere render smoke test.

The human-label action-shape issue is DOMAIN-001. No WebView-local inventory-slot classifier was found; do not introduce one to solve it.

## 11. Steam Userdata / Game Settings

Discovery checks known Steam roots/libraries and numeric profiles; it does not infer personal identity from IDs. The connection flow seeks user consent and remembers canonical folders locally. CFG and userdata readers retain separate states and persistence. Manual selection remains available when discovery fails.

Video access checks folder/file identity, rejects symlinks, bounds byte reads, compares opened file identity and honors unsaved buffers. Missing, malformed, unavailable and disconnected states remain distinguishable. The parser supports a deliberately bounded flat KeyValues subset, preserves unknown literal fields and refuses derived values after structural/duplicate-key errors.

Resolution, aspect ratio and numerator/denominator frequency are mathematical derivations. Fullscreen/VSync/MSAA values are not turned into unverified enum claims. Vendor/device/version/autoconfig-style fields remain raw and non-editable in the inspection model. Opening the authorized file in the text editor is manual editing, not a silent userdata writer or verified video editor.

The local UI necessarily receives authorized paths/profile information. No shareable-report exporter currently exists, so an implemented export leak was not found. Future exports need deliberate redaction; the raw settings Output channel should not be described as sanitized sharing output.

**Observation:** `SteamUserdata.refresh` chooses the lexically first matching saved-controls filename. That is a bounded opening shortcut, not a unified controls model. Before introducing a controls editor or saved-vs-autoexec comparison, show/select the relevant file/slot instead of treating the first match as the user's effective controls.

## 12. Filesystem / Safe Editing

Existing folder handling has concrete safety protections: canonical authorized root, regular-file checks, symlink exclusion, valid simple filenames, snapshot/generation checks, exclusive empty-file creation (`wx`), trusted-workspace gating in UI commands, dirty-buffer checks and confirmed nonrecursive deletion to Trash with identity revalidation. User CFGs are not executed.

The new builder edits tokens in the editor with undo, preserves unrelated source and CRLF/final-newline behavior, checks source/version/disk snapshots, and uses non-overwriting creation for new files. These are useful safeguards; they do not yet cover every destination/lifecycle invariant.

### WRITE-001 — Builder destination changes do not invalidate host previews

- **Severity:** High.
- **Area / evidence:** `src/vscode/autoexec-builder.ts`, `AutoexecBuilder.show(uri)`, preview receiver and apply receiver. `chooseDestination` clears `snapshot` and advances `sequence`; `show(uri)` assigns `destination` without those operations. Apply checks sequence/warnings, but not snapshot URI against the current destination.
- **Reproduction:** create the builder with a mocked VS Code bridge; give it destination A, a stored preview for A, sequence 7 and an existing panel. Call `show(B)`. Observed result: `destination = B`, `retainedSnapshot.uri = A`, `sequence = 7`. This was reproduced without reading or writing either file.
- **Failure flow:** an already posted Apply for A can still satisfy the host sequence check after B is displayed. Also, `show(B)` can occur while preview A awaits filesystem/editor work; the preview continuation has no destination-generation check before storing/sending A's result under B's current state. The UI invalidates its own state on destination change, but that does not enforce the host invariant or cancel an in-flight preview.
- **Impact:** application can target a different file from the currently displayed destination. No real user-file mutation or data loss was attempted during the audit.
- **Recommendation:** every destination transition must atomically invalidate the host preview and advance a destination generation. Recheck that generation/URI after preview awaits and immediately before Apply. Require snapshot URI to match the active destination. Keep editor undo and existing freshness checks.
- **Acceptance:** host tests cover reopening with URI B after preview A, B during asynchronous preview A, queued stale Apply, panel disposal and unchanged-destination reopen. A is never edited after its destination authorization has been superseded.

### WRITE-002 — Builder reads whole destinations before enforcing size limits

- **Severity:** Medium.
- **Area / evidence:** `src/vscode/autoexec-builder.ts`, `diskText`, uses unrestricted `fs.readFile(..., 'utf8')`. Destination existence checks, preview and freshness validation call it before `previewBinds` rejects sources above one million characters.
- **Impact:** selecting a very large CFG can allocate/read the whole file repeatedly in the extension host despite the advertised bounded analysis model. This is a resource-handling problem, not demonstrated file corruption.
- **Recommendation:** implement a bounded read with preflight/opened-file checks for builder destinations, while retaining editor-buffer limits and explicit selection. Return a specific size-limit message. Reuse a small shared file-read helper only if it genuinely suits both readers; no general filesystem framework is required.
- **Acceptance:** oversized files and oversized unsaved buffers are rejected before whole-file allocation/parsing; stale changes remain blocked and existing text/encoding is preserved on supported operations.

A reusable source writer can grow from the new localized edit primitives when a second builder needs it. Its absence as a named `SafeWriteService` is not a current architectural defect. Broader overwrite/backup/migration workflows remain unimplemented and must not be inferred from a narrow bind preview.

## 13. Performance

Useful controls already exist: activation-scoped catalog loading, URI/version parsing cache, cached effective results, debounce, source-size limits, bounded effective expansion, capped Hub enumeration and generation cancellation. Ordinary formatting/completion paths make no network requests. No published latency/memory target was independently measured here.

### PERF-001 — Document links launch all target checks before honoring cancellation

- **Severity:** Medium.
- **Area / evidence:** `src/vscode/providers.ts`, `provideDocumentLinks`, uses `Promise.all` over every parsed exec statement; `execTarget` issues a filesystem stat for each. Cancellation is checked only after the entire batch returns.
- **Impact:** a file below the character limit can still contain thousands of execs, including repeated targets. One request launches all stats concurrently; canceled requests continue their I/O. This is a concrete expensive path, especially for virtual/remote filesystem providers, rather than a speculative need for incremental parsing.
- **Recommendation:** stop scheduling work when canceled, deduplicate identical targets within a request, and bound filesystem concurrency or traversal work. Keep honest unresolved links; do not execute CFG to resolve them.
- **Acceptance:** a synthetic many-exec document has bounded in-flight stat calls and promptly stops scheduling on cancellation; normal extension/path variants still resolve correctly.

Bind Map history projection scans history per key and Command Explorer scans/sorts suggestions, but bounded effective operations and practical catalog size reduce their current risk. No refactor or new index is recommended without measured latency attributable to those operations.

## 14. Tests

Behavioral coverage is substantial: malformed source recovery; literal strings/comments/separators; CRLF/BOM/idempotence; source-preserving token edits; invalid catalog metadata; hashes and deterministic checks; alias order/cycles; uncertainty barriers; resets/reassignments; localized meanings; host message validation; stale navigation; file consent/removal; buffer-vs-disk analysis; video parsing and UI keyboard/literal-safety checks.

Passing tests provide useful regression evidence. They missed ANALYSIS-001, DATA-001 and WRITE-001 because those invariants were not exercised. Short-label introduction also showed why some assertions need to distinguish description from meaning instead of assuming they are identical.

### VERIFY-001 — Integration evidence is incomplete because the runner does not finish reliably

- **Severity:** Medium.
- **Area / evidence:** `scripts/test-vscode.ps1` uses a fixed profile and a 60-second wait/kill; `tests/integration/index.cjs` cleanup ended with `ENOTEMPTY` at the temporary root. Logs from this review show mutex errors, that cleanup failure and later access-denied process termination. Initial browser startup also hit a transient `DevToolsActivePort` lock.
- **Impact:** a cleanup error can obscure the preceding functional outcome; process/profile collisions and test-output races make acceptance evidence harder to trust. Unit and host-capture success cannot substitute for the failed suite.
- **Recommendation:** run host acceptance on an isolated, unchanged build; ensure per-run profile/output isolation and cleanup of only owned synthetic files. Preserve the primary assertion failure separately from cleanup failures, and handle owned-process timeout reporting robustly. For browser startup, retry a transient port-file sharing error within the existing bounded wait. Do not suppress genuine assertions or weaken safety checks to obtain green results.
- **Acceptance:** repeated isolated Windows runs conclude with an explicit success/failure marker, preserve useful logs and avoid profile collision. Test cleanup cannot overwrite an earlier assertion's evidence.

CI currently runs Linux style/unit/catalog/build/package checks. It does not run the Windows host or browser suites. Extend CI only with an available, reliable host/browser environment; do not label current CI green as comprehensive UI acceptance.

## 15. Security / Trust Boundaries

Software security and command/game validity are separate. The audited extension does not run CFG text as shell/game commands. Steam discovery's registry query uses fixed `execFile` arguments, timeout and hidden window, rather than interpolated CFG data. Fetching is a development action with pinned candidates, not a typing-path network call.

Production WebViews use restrictive `default-src 'none'`, nonce scripts and scoped local resources. Dynamic command text, descriptions, filenames and bodies are rendered with `textContent`/DOM creation. Explorer source links require HTTPS; Markdown is untrusted. Host messages validate action names/shapes and resolve indices against host-owned state instead of accepting arbitrary paths/offsets. No demonstrated WebView HTML injection or arbitrary shell execution was found.

WRITE-001 is a host authorization/freshness problem even with a safely rendered UI. Its correction belongs at the host boundary.

**Observation:** exec link resolution rejects absolute/traversal syntax but does not canonicalize local symlink targets. This is navigation, not automatic game execution or a read-and-export path. Its comment promising confinement to the selected root is stronger than the implementation's lexical guarantee. If physical containment is a product requirement, enforce it for local file URIs; otherwise document that navigation can follow filesystem links. No high-severity security claim is made from this alone.

The package file-list review found no fixtures, raw source catalog, test profiles or candidate dumps in the candidate VSIX. The new audit document itself is not excluded by the current `.vscodeignore` rules for specific docs; future release preparation should review whether audits belong in the distribution. No package was generated to change an existing release.

## 16. Documentation

The maintained architecture and guides generally distinguish local analysis from game state, source snapshots from runtime verification, and available tools from planned multi-file/builders/migration work. The older architecture audit clearly labels its table as a historical baseline; its stale rows must not be reused as fresh findings.

### DOC-001 — Overview/status statements remain inconsistent

- **Severity:** Low.
- **Area / evidence:** `README.md` contains a fixed `0.0.4` badge while the observed manifest is `1.3.0`. Its future list still includes Steam userdata integration, although read-only integration/video already work. The English short feature list omits the existing Explorer/video coverage described in the Portuguese overview. `docs/planning/implementation-plan.md` opens with “Este plano não inicia os builders” while a later paragraph reports the implemented Autoexec Builder MVP.
- **Impact:** users/contributors can mistake implemented capabilities for future work or infer an obsolete version. This is documentation drift, not a missing architecture subsystem.
- **Recommendation:** align short bilingual overviews and distinguish implemented read-only userdata/bind-builder work from broader saved-settings/specialized builders. Remove fixed guide version duplication or derive it as part of explicit release work. Revise historical/status phrasing without erasing release history.
- **Acceptance:** the two overviews describe the same implemented capabilities, and status/planning has no contradictory current claims. Existing release metadata is not changed merely to fix prose.

Some wording remains deliberately technical in detailed health output (“modeled subset”, selected console report) and evidence blocks. That is useful when diagnosing limitations, but keep the primary file/action label human-first. The new semantic-evidence block is shared domain presentation; render it in secondary details where appropriate rather than removing its provenance.

## 17. Future Feature Readiness

READY means current foundations support the named bounded capability. PARTIALLY READY means reusable foundations exist but required behavior/safety is unfinished. NOT READY means the required product-specific model/evidence has not been implemented. A planned gap is not automatically a current defect.

| Feature                         | Readiness                      | Blocking gaps / safe next increment                                                                                                                  |
| ------------------------------- | ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| Autoexec Builder, simple binds  | PARTIALLY READY                | New MVP exists; correct WRITE-001/002 and obtain clean host acceptance before broadening writes.                                                     |
| Bind Editor                     | PARTIALLY READY                | Map/components and localized previews exist; interactive editing lifecycle, action validation and destination safety need acceptance.                |
| Alias Builder                   | PARTIALLY READY                | Parser/local execution exist; resolve ANALYSIS-001, then structured body/signature/cycle validation and preview.                                     |
| Crosshair Builder               | PARTIALLY READY                | Shared documented parameters/compatibility metadata exist; verified applicability/visual semantics and safe edits are incomplete.                    |
| Radar Builder                   | PARTIALLY READY                | Registry/parameters/local edits can be reused; builder-specific supported controls and previews are absent.                                          |
| Viewmodel Builder               | PARTIALLY READY                | Documentation/value foundations exist; visual model and bounded editing feature are absent.                                                          |
| Practice Builder                | PARTIALLY READY                | CFG/registry/preview foundations exist; reviewed templates, context/cheat requirements and restoration behavior need evidence.                       |
| Config Doctor                   | PARTIALLY READY                | Health findings/history/limits exist; consistent alias findings, explanations and cross-file context remain incomplete.                              |
| Local literal semantic diff     | PARTIALLY READY                | State/history and offsets are reusable; explicit comparison rules must preserve unknown/deferred actions.                                            |
| Multi-file semantic diff        | NOT READY                      | Ordered file graph/execution model and dynamic-path uncertainty are absent.                                                                          |
| Execution Trace                 | PARTIALLY READY                | Local history/invocations exist; explicit cross-file identities, graph, order and budgets are missing.                                               |
| File Map                        | PARTIALLY READY                | Exec tokens/navigation and authorized file access exist; dependency graph/cycle visualization is unimplemented.                                      |
| Multi-file effective analysis   | PARTIALLY READY                | Extend current engine with injected resolver and file-aware origins; unsaved buffers, ordering, cycles, cancellation and limits must be implemented. |
| Migration Assistant             | NOT READY                      | Build-scoped historical rules and proven equivalence/value transformations are missing.                                                              |
| Steam settings inspection       | READY for current video subset | Keep bounded read-only parser; controls/crosshair/radar saved-state models are separate future work.                                                 |
| Video Editor                    | NOT READY                      | Verified enums/editability, source-preserving userdata writes, preview/backup and stale-file protection are not implemented.                         |
| Saved settings vs Autoexec      | NOT READY                      | No unified precedence model over saved settings and CFG execution.                                                                                   |
| General source-preserving edits | PARTIALLY READY                | Original source/trivia/offsets and narrow edits exist; general edit ownership, grammar/encoding and lifecycle coverage are incomplete.               |
| Backup / Restore                | NOT READY                      | No explicit snapshot/restore workflow; editor undo and Trash are narrower protections.                                                               |
| Shareable Report                | PARTIALLY READY                | Structured health/text presentation exist; explicit privacy redaction/export contract is missing.                                                    |

### Explicit answers to the audit questions

1. **Clean enough to continue?** Yes, incrementally; correct the builder destination invariant before expanding file-editing work.
2. **Single metadata source of truth?** Yes: curated/technical sources generate one catalog consumed through the registry. Provider example lists are a limited exception, not a second command database.
3. **Provenance correct?** Generally yes at field level; unresolved cross-source constraint conflicts still need DATA-001. No identified build/runtime guarantee is implied.
4. **Parser robust enough for visual editing?** For supported localized token edits, yes; for arbitrary semantic/source transformations, only partially.
5. **Static analysis trustworthy?** Useful within its explicit subset; not a runtime validator. ANALYSIS-001 must be fixed before relying on it for stronger automated explanations.
6. **Uncertainty/effective state honest?** Largely yes: order/history, deferred bodies, limits and partial results are explicit. Certainty denotes the bounded symbolic model.
7. **Domain separate from UI?** Yes in the reviewed feature paths.
8. **WebViews sufficiently dumb?** Generally yes; they render models and emit actions. The host still needs the WRITE-001 invariant.
9. **Filesystem safe?** Existing folder operations have meaningful protections; builder destination and bounded reads need correction. No blanket safety certification is appropriate.
10. **Steam userdata architecture sound?** Yes for bounded read-only video inspection and explicit manual opening; broader saved-settings semantics remain absent.
11. **Prepared for Autoexec Builder?** A narrow bind MVP now exists; acceptance/safety corrections are required before broadening it.
12. **Prepared for multi-file analysis?** The local engine is reusable; file-aware graph/execution/resolution is not implemented.
13. **Prepared for source-preserving edits?** Narrow primitives exist; general writing remains partial.
14. **UI/UX consistent?** Mostly coherent in reviewed screens; narrow Hub filename recognition needs correction. Unreviewed host screens are not visually certified.
15. **Meaningful test confidence?** Yes for many behaviors, but missing invariants and failed host runs limit acceptance.
16. **Top five risks?** Listed in section 1 with linked finding IDs.
17. **Top five strengths?** Listed in section 1; preserve them during corrections.
18. **Before the next large feature?** Correct destination authorization, alias consistency, applicable metadata conflicts and obtain reliable host acceptance; avoid a wholesale redesign.

## Recommended Correction Order

### P0 — Must fix before further file-editing feature work

- **WRITE-001:** invalidate and bind previews to every destination transition; reject late previews and stale Apply at the host boundary. Add host lifecycle regressions before enabling broader builder edits.

No Critical defect or demonstrated user-file loss was established. P0 here protects the currently arriving editing feature, not a claim that read-only language tooling must stop.

### P1 — Fix before expanding Autoexec Builder

- **WRITE-002:** bound destination reads and distinguish size-limit errors.
- **ANALYSIS-001:** align ordered alias resolution and shared cycle findings.
- **DATA-001:** reject applicable unresolved cross-source constraint conflicts.
- **VERIFY-001:** establish a reliable isolated host acceptance run for the new editing lifecycle; preserve assertion and cleanup evidence separately.

### P2 — Fix during the next incremental phase

- **UX-001:** preserve recognizable filenames in narrow Hub layouts.
- **PERF-001:** bound/cancel document-link filesystem requests.
- **DOMAIN-001:** validate action shape before assigning a reviewed whole-action meaning.
- Implement multi-file origins/resolver/graph only when workspace analysis enters the authorized scope; retain the existing engine and explicit partial results.

### P3 — Opportunistic corrections

- **ARCH-001:** specific catalog activation failure/recovery message.
- **DOC-001:** align overviews, version references and current/planned wording.
- Clarify exec symlink navigation guarantees and saved-controls first-file selection before those behaviors acquire stronger product promises.
- Review inclusion of audit documents at the next explicitly requested release.

This audit recommends targeted corrections and behavioral acceptance criteria. It does not authorize implementing them, changing fixtures, promoting data, regenerating a release or publishing anything.
