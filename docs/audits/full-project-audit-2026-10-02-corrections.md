# CS2 Config Tools — Audit corrections

Correction date: 2026-10-02, America/Sao_Paulo. Scope: the existing working tree and the findings in the [historical full audit](full-project-audit-2026-10-02.md). That audit is preserved. The correction work retains registry/core/editor boundaries and the parser; it introduces no additional feature, runtime dependency or release.

## Baseline and evidence boundary

HEAD was `e5ba1fbd16405e2298d8ea301a75e45dc688eaae`; modified/untracked builder, metadata, UI and documentation work already existed. Its state is recorded in ignored `.test-output/corrections/baseline-git.txt`. Those changes and CFG fixtures were preserved. The correction scope is not the full Git diff against HEAD.

The correction baseline passed `npm test` (86 unit tests plus catalog/build), style, Bind Map browser, Hub browser and Windows integration. This differs from the historical audit's earlier runner failures. Passing baseline checks did not exercise the audited invariants.

Node `v22.23.3` was used through a temporary process PATH. Windows host acceptance uses isolated VS Code `1.96.4`; browser acceptance uses local Chromium/Edge. Logs and screenshots are ignored local artifacts, not distributed assets. No CFG was executed, game installation changed, upstream catalog fetched/promoted, version bumped, VSIX generated, extension installed, tag created or publication performed.

## WRITE-001

**Status:** Resolved.

**Root cause:** destination transitions and asynchronous continuations did not share host authorization; a sequence alone did not identify the current destination/session.

**Change:** one destination transition invalidates the preview, advances destination generation and clears pending authority. Snapshots include URI, destination and preview generations, exact source, document version and disk text. Preview continuations check current panel/generation/sequence after awaits. Apply requires an authorization callback, rechecked across disk/editor awaits and immediately before edits. Cancel invalidates pending work; disposal prevents late publication. Reopening an unchanged URI retains a fresh preview and still checks source freshness.

**Tests:** `autoexec-builder-host.test.cjs` covers preview A → B → stale Apply, B preview followed by queued A Apply, forged URI mismatch, unchanged-URI reopen, pending filesystem ABA transition, destination change during Apply, cancel during pending preview and disposal during document opening. Existing integration checks verify undo, stale buffers/disks and exclusive creation.

**Guardrail:** host authority and immutable preview contracts in AGENTS and the feature entry checklist; the Apply helper requires explicit authority from its caller.

**Remaining risk:** supported editor edits are not a general filesystem transaction/backup system. Cancel prevents pending work from committing before Apply's mutation boundary; undo handles already committed editor edits.

## WRITE-002

**Status:** Resolved.

**Root cause:** complete disk reads preceded source-size validation.

**Change:** a small bounded UTF-8 reader checks regular-file status, symlink exclusion and size before opening/allocation; compares opened/path identity and modification metadata around a capped read; and rejects invalid UTF-8 explicitly. Builder disk reads are capped at four million bytes and preview text at one million characters. Unsaved buffers use the character cap. Typed failures distinguish size, missing, inaccessible, unsupported/changing source and nonregular files.

**Tests:** `bounded-io.test.cjs` proves an oversized file is rejected before open, preserves BOM/Unicode/CRLF, and exercises invalid encoding, directory/missing paths and a changed opened file. Host tests reject excessive editor text without authorizing Apply. Existing builder tests preserve comments, quoting, unrelated source, CRLF and final newline; integration verifies stale-source and undo behavior.

**Guardrail:** bound external input before expensive allocation and preserve source; reuse the purposeful reader rather than introducing a general filesystem layer.

**Remaining risk:** byte and character limits are separate; supported UTF-8 may be decoded within the byte bound before the character bound can be established. Unsupported encodings are rejected, not converted. File metadata is a bounded freshness check, not universal race-free filesystem locking.

## ANALYSIS-001

**Status:** Resolved.

**Root cause:** whole-document alias maps, textual scopes and ordered execution independently interpreted immediate uses; cycle warnings were adapter-local.

**Change:** `core/ordered-aliases.ts` owns ordered expansion, definitions/redefinitions, native/alias/uncertain interpretations, dynamically created aliases, deferred scope and cycle/budget limits. Effective state reduces its steps. Parameters, diagnostics, Health and inlays consume the same facts. Raw parameter checking is separate from alias resolution to avoid circular ownership. Core diagnostics owns cycle findings used by Health and the editor.

**Tests:** `alias-semantics.test.cjs` covers the audit's retroactive shadow suppression, invoked alias creation, redefinitions, queries, deferred uses, recursion, budget and aligned cycle findings. Existing effective/diagnostic tests protect resets, history, uncertainty and malformed-source behavior.

**Guardrail:** one semantic fact has one owner; preserve written order and deferred uncertainty without moving interpretation into presentation.

**Remaining risk:** this remains a bounded single-file symbolic model. Unknown effects/execs invalidate certainty; deferred document-scoped aliases are not proof of game execution. Repeated source bodies with differing interpretations remain uncertain.

## DATA-001

**Status:** Resolved.

**Root cause:** independently valid parameter metadata could contradict applicable technical domains; consumers hid the conflict through precedence.

**Change:** catalog validation rejects incompatible applicable ranges, enum members and defaults. Compatible curated subsets are retained. Explicit reviewed parameter scopes identify a source/build and require known snapshot applicability before separating differing builds. Registry helpers select applicable parameters and supported bounds for documentation, parameter checking, completion, meanings and builders. Literal technical enum members require provenance; an enum name alone does not establish members. No actual game values or build claims were added.

**Tests:** `catalog-integrity.test.cjs` covers disjoint ranges, defaults/enums outside technical bounds, invalid defaults/types, inverted ranges, compatible subsets, explicit differing builds, unreviewed scope and same-build contradictions. Existing invalid-data and deterministic generation tests remain green; `catalog`/`catalog:check` verify generated output.

**Guardrail:** applicable conflicts fail generation; consumers use registry applicability/bounds rather than choosing arbitrary source precedence.

**Remaining risk:** explicit build scope is narrow; arbitrary runtime contexts and historical migration rules are not modeled. Unknown build scope cannot authorize an override. Current snapshot values are still not defaults or runtime verification.

## VERIFY-001

**Status:** Resolved for runner isolation, primary-result reporting and the required local acceptance matrix.

**Root cause:** shared profiles/output and brittle directory cleanup obscured acceptance; PowerShell process exit reporting could be empty; browser port-file sharing was not retried.

**Change:** the PowerShell entry delegates to a small Node runner with a native process close result, unique owned output/profile/extensions, per-run test-file environment and explicit PASS/FAIL record. Timeout reports the primary failure independently of termination failure and targets only its ChildProcess. Synthetic cleanup validates containment and preserves an earlier assertion; browser startup retries known temporary port-file conditions within its bounded wait. Browser outputs are unique too.

**Tests:** cleanup regression distinguishes primary/secondary failure and rejects outside targets; startup regression retries EBUSY and rejects a permanent error. Three consecutive isolated runs passed on an unchanged build:

1. `.test-output/integration-ZqyKM4/result.txt`
2. `.test-output/integration-GZPODR/result.txt`
3. `.test-output/integration-bfBvbh/result.txt`

Each includes Autoexec Builder and Extension Host PASS markers. Full stdout/stderr remain with each run. A separate real builder host capture passed in `.test-output/autoexec-builder-host-UXEpdQ/`.

**Guardrail:** isolate resources/process ownership; never retry assertions or let cleanup replace primary evidence. Do not broaden writes over red safety/host checks.

**Remaining risk:** VS Code 1.96.4 still emits global mutex, API-proposal/authentication and synthetic-directory watcher warnings. They are retained, not suppressed or presented as eliminated. Three local runs establish this acceptance result, not reliability across all machines/versions.

**Development failures preserved:** an initial integration attempt overlapped an auditor-started build replacing `dist`, so activation failed; it was excluded from acceptance. A later isolated run exposed a drive-letter-case assumption in the test's raw path comparison; expected/actual now compare normalized VS Code URIs. Expanded screenshot testing initially called an HTML-only click method on SVG; corrected to the existing dispatched mouse-event path. These were harness failures, not retries of failed application assertions to obtain green evidence.

## UX-001

**Status:** Resolved.

**Root cause:** fitting the table by wrapping filenames sacrificed the primary file-recognition task.

**Change:** preserve one-line filenames and a modest minimum table width with local scrolling. Existing rows/actions and their keyboard navigation remain intact.

**Tests:** Hub browser assertions verify single-line unclipped filename text, page bounds and focus reaching offscreen row actions through the local scroll region. Reviewed dark/light screenshots at 420, 900 and 1440 pixels, plus longer `practice-team-weekend-custom.cfg` at 420. Final capture directory: `.test-output/config-hub-browser-KYSft6/`.

**Guardrail:** task-oriented visual acceptance extends beyond no-overflow assertions.

**Remaining risk:** narrow users scroll locally for actions. Longer filenames can require local movement; this preserves literal identity rather than guessing an abbreviated filename. Browser evidence does not certify every editor theme or screen reader.

## PERF-001

**Status:** Resolved.

**Root cause:** all target stats launched before cancellation could stop scheduling.

**Change:** per-request normalized-name grouping preserves every source location while checking repeated targets once. Four workers bound in-flight filesystem operations. Cancellation is checked during grouping, before scheduling and after awaits; canceled results are discarded.

**Tests:** synthetic many-exec regression checks peak concurrency, duplicate extension variants, preserved source locations, cancellation stopping new work and traversal/absolute names remaining unresolved. Host integration verifies actual local exec links.

**Guardrail:** bounded external work and cancellation that prevents new expensive work.

**Remaining risk:** an already issued VS Code filesystem stat cannot be forcibly interrupted through this API. Links remain navigation only; targets are not executed or included in effective analysis.

## DOMAIN-001

**Status:** Resolved.

**Root cause:** a recognized first token received a reviewed complete-action label despite extra arguments.

**Change:** shared core action-shape helpers gate human meanings in Bind Map, preview descriptions and builder validation. Reviewed inventory-slot meanings require the literal no-argument shape. Malformed/chained bodies retain raw representation without a confident whole-action label.

**Tests:** regression covers literal `slot8`, `slot8 unexpected`, chains and malformed quotes; existing builder tests retain rejection and source preservation. Browser/integration checks retain shared hover and literal DOM safety.

**Guardrail:** human labels describe only recognized reviewed shapes; semantics remain outside WebViews.

**Remaining risk:** shape compatibility establishes the community mapping, not game acceptance, possession or build-specific behavior. Other command descriptions remain documentation, not verified signatures.

## ARCH-001

**Status:** Resolved.

**Root cause:** startup catalog errors escaped without a specific extension recovery explanation.

**Change:** activation reports catalog failure, unavailable analysis and reinstall/development-rebuild recovery; underlying error is logged. No providers register and no empty registry substitutes misleading results.

**Tests:** missing file, malformed JSON and duplicate symbol fail visibly before provider registration; a normal catalog registers providers without a recovery error. Normal host activation passes.

**Guardrail:** explicit fail-closed startup; packaged catalog validation remains a build responsibility.

**Remaining risk:** recovery is manual. This is not a general runtime schema validator or silent repair mechanism.

## DOC-001

**Status:** Resolved.

**Root cause:** fixed overview version and current/future capability wording drifted across maintained documents.

**Change:** removed the obsolete fixed version badge, added implemented Explorer/read-only video benefits to the English overview and kept broader saved-settings editing planned. Builder wording already matched the MVP at this correction baseline; planning now links safety entry gates. Bilingual guides describe the corrected behavior/limits. Unreleased, architecture, data contracts, contributor guidance, status and AGENTS contain the appropriate contracts. [Future feature checklist](../development-safety.md) covers writes, semantics, filesystem work and WebViews without duplicating existing boundary/release rules.

**Tests:** documentation formatting/link review and current-claim review; package file-list review excludes audit/development evidence while retaining all runtime modules/assets.

**Guardrail:** current features, planned work and evidence boundaries remain distinct; versions stay in manifest/changelog and releases require explicit requests.

**Remaining risk:** documentation maintenance remains ongoing. Historical audit/planning/release records retain their original context.

## Additional observations

Exec resolution now explicitly documents lexical rejection of absolute/traversal names, not physical root confinement. Editor navigation can follow symlinks; no game execution or cross-file analysis is implied. Saved-controls first-match selection is documented as an opening shortcut; a future controls model must identify/select the relevant file/slot and evidence. Audits and development safety material are excluded from candidate distribution contents.

## Acceptance and visual review

Final gates: catalog generation/check, build, style, unit, Bind Map browser, Hub browser and isolated Windows integration. Unit acceptance is 97/97; the three consecutive host runs above preserve their own output and primary evidence. `vsce ls` inspected candidate contents only: bounded reader, ordered alias/value helpers, link scheduler, registry and builder runtime/assets are present; tests, fixtures, source catalog, profiles, audit documents and ignored outputs are excluded.

Hub screenshots show recognizable short/long filenames, preserved row associations and local scrolling at narrow widths; medium/wide rows retain directly visible actions. Bind Map dark/light screenshots at 420, 1050 and 1500 pixels were reviewed from `.test-output/bind-map-browser-I9L9G7/`: fixed-size keys and local keyboard scrolling, coherent mouse regions, category/state markers and readable selected inspector survive the widths. Additional high-contrast reference assertions remain in the suite. These are production-renderer browser captures with a simulated editor bridge, not claims of comprehensive host/accessibility/game acceptance. The separate builder host captures use actual VS Code and synthetic files.

All ten findings have localized corrections and invariant coverage. Larger builders, multi-file execution, saved-state precedence, verified game semantics, migration and general writing/backup remain outside this task.

Local reviewed evidence: [Hub narrow](../../.test-output/config-hub-browser-KYSft6/light-420.png), [Hub medium](../../.test-output/config-hub-browser-KYSft6/dark-900.png), [Hub wide](../../.test-output/config-hub-browser-KYSft6/light-1440.png), [long filename](../../.test-output/config-hub-browser-KYSft6/dark-long-420.png); [Bind Map narrow](../../.test-output/bind-map-browser-I9L9G7/dark-420.png), [medium](../../.test-output/bind-map-browser-I9L9G7/light-1050.png), [wide](../../.test-output/bind-map-browser-I9L9G7/dark-1500.png); [builder host preview](../../.test-output/autoexec-builder-host-UXEpdQ/wide-preview.png). These ignored artifacts are available only in this checkout. Final npm wrapper logs are under `.test-output/corrections/final-*.log`; later wrapper screenshots have the same production renderer and additional unique run directories.
