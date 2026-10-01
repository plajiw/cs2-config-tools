# Architecture audit

Audit date: 2026-10-01. Source review only; no new game verification or performance benchmark. A useful editing prototype exists, but the master architecture is not implemented end to end.

This table records the baseline before the first registry increment. Since then, lookup and visibility moved to `src/catalog/registry.ts`, complete ConVar/command discovery and explicit promotion were added, and schema 2 separates field provenance, technical metadata and documentation state. Conflicting curated source merges now fail instead of silently overwriting. The effective model, full source schema and action semantics remain unfinished; see [current status](status.md).

| Area            | Current state                                                 | Gap / action                                                                     |
| --------------- | ------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| Activation      | `src/extension.ts` registers adapters                         | Keep small; no rewrite                                                           |
| Registry        | `src/vscode/services.ts` builds map/name set                  | Extract editor-independent registry                                              |
| Metadata        | `src/catalog/types.ts` models selected parameters and sources | Typed lifecycle/context and field-level evidence missing                         |
| Generation      | `scripts/build-catalog.cjs` combines reviewed JSON            | Shallow merges permit silent precedence; validate conflicts/final schema         |
| Evidence        | Generated entries retain coarse pending/unknown fields        | Separate fact confidence from entry-level status                                 |
| Import          | Pinned candidates via `scripts/fetch-community.cjs`           | Limited to known names; full discovery/diffs deferred                            |
| Parsing         | Nested statements with offsets in `src/core/parser.ts`        | Flat representation lacks parent/trivia and execution-order semantics            |
| Aliases         | Collected local definition map                                | Order and deferred nested definitions not modeled                                |
| Documentation   | Compact sourced Markdown in `src/vscode/documentation.ts`     | Shared documentation facts missing; improve example selection/completion wording |
| Completion      | Catalog plus provider-local key/buy/exec lists                | Move reusable action facts into shared services/data                             |
| Diagnostics     | Syntax, unknown symbols, console and hidden-name notices      | Parameter/context checks missing; console rejection list duplicated in code      |
| Formatter       | Pure conservative physical-line formatting                    | Preserve guarantees; not a semantic source writer                                |
| Exec            | Safe links in `src/vscode/paths.ts`                           | No graph; filesystem failures collapse to unresolved                             |
| Effective model | Absent                                                        | Required before health and visual tools                                          |
| Visual tools    | No WebViews/builders                                          | Wait for shared model acceptance                                                 |
| Performance     | Cache, debounce, oversized-document guard                     | Unmeasured; guard counts characters, not exact bytes                             |
| Tests/CI        | Unit suite, Windows editor runner; CI style/unit/package      | Editor host absent from CI; cross-platform/game checks not established           |

## Priority and limits

Start with validated registry contracts and provenance while retaining editor behavior. Then strengthen source structure, documentation and static semantics. Correct flattened alias-state assumptions before visual editing.

Existing `src/core/`, `src/catalog/` and `src/vscode/` boundaries support incremental work. No full tree migration, language server or new runtime dependency is justified by this audit alone.

The workspace is not a Git checkout, so no tracked/untracked comparison was available. Preserve user edits in CFG fixtures. Source review and editor tests do not identify the installed CS2 build, prove command effects or establish latency targets.

See the [implementation plan](implementation-plan.md) for acceptance gates.
