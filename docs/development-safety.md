# Future feature entry checklist

Use these questions before implementing behavior that crosses the corresponding boundary. Existing rules remain in [AGENTS.md](../AGENTS.md); this checklist does not authorize a release or feature expansion. Change architecture only for a demonstrated correctness, maintenance, scalability or product problem.

## File writes

1. Who owns current destination authority?
2. Which destination, source and change-set transitions invalidate the immutable preview?
3. How are source identity/version and disk freshness rechecked before Apply?
4. Is the requested change structured, validated and previewed?
5. Which unrelated text, comments, spacing, quotes, line endings and final newline are preserved?
6. What happens if source or destination changes across each await?
7. What byte/character limits apply before allocation and parsing?
8. Which session/generation prevents late results overwriting current state?
9. Which regression rejects stale Apply after destination switching, including A → B → A?
10. Which human preview and raw diff does the user review?
11. Does Cancel guarantee no mutation before Apply commits, including pending work?
12. What undo/recovery path exists? Is destructive replacement explicitly confirmed?

Do not broaden file writing while write-safety or host acceptance checks fail.

## Semantic facts

1. Who owns the fact, and does another consumer already model it?
2. Is it technical evidence or curated explanation?
3. What source, confidence and build/context scope apply?
4. Does complete action shape justify the human meaning?
5. How do conflicting applicable sources fail before generation?
6. Which invariant regression protects interpretation, order and uncertainty?

Missing from a dump does not mean removed. Shared consumers agree on semantic facts; presentation wording may differ.

## Filesystem work

1. Are size, traversal and expansion bounded before expensive work?
2. Is concurrency bounded and deduplicated where appropriate?
3. Does cancellation stop scheduling new work?
4. Are symlinks relevant, and are lexical versus physical guarantees explicit?
5. Is opened-file identity revalidated after asynchronous work?
6. Are test paths/profiles/processes owned and isolated? Can cleanup hide a primary failure?

## WebViews

1. What host-owned model is rendered?
2. Which typed messages may the UI request, and how are shape/size/index validated?
3. Can UI-controlled data select arbitrary paths, permissions, ranges or document versions?
4. Are dynamic text, CSP and local resources handled safely?
5. Do business rules and semantic interpretation remain in shared core/registry services?
6. Do narrow/medium/wide screenshots show filename recognition, keyboard readability, mouse geometry and inspector usability in supported dark/light themes?

Tests and rendering are evidence with stated limits, not proof of architectural quality or task usability.

## Acceptance ownership

Finish the build before starting host acceptance. Do not rebuild or mutate emitted modules while an acceptance host is loading or running them. Run capture and integration launchers sequentially against that unchanged build; unique profiles do not protect against a shared `dist` directory being rebuilt.

Review filename recognition, visible literal values, distinct mouse hit targets, selection/focus and intentional empty states. Retain screenshots, measurements and primary failures alongside the pass markers. A capture of production pages with synthetic host models validates rendering and the bridge, while command lifecycle acceptance still requires the integration suite.

Editor commands and document-change notifications can arrive separately. Focus the owned test editor and wait for the expected document state with a deadline. Issue undo once and require exact source restoration; do not retry a mutating command to hide a timing failure.
