# Working on CS2 Config Tools

Read `README.md`, `CONTRIBUTING.md` and `docs/architecture.md` before changing behavior. This is a community VS Code extension, not a game automation tool.

Read `PROJECT_VISION.md` and `docs/planning/implementation-plan.md` for direction and dependencies. The preserved master specification is a long-term proposal: its illustrative interfaces, values and folders are not verified game facts or an instruction to implement everything at once. Follow the user's authorized scope and work incrementally.

## Boundaries

- `src/core/` contains editor-independent TypeScript. Do not import `vscode` there.
- `src/vscode/` adapts the core to editor providers. `src/extension.ts` only wires activation.
- Edit catalog source JSON in `catalog/source/`; rebuild `catalog/catalog.json` with `npm run catalog`.
- Keep language assets in `resources/`, scripts in `scripts/`, documentation in `docs/` and generated VSIX files in `artifacts/`.
- Never overwrite an existing release or VSIX. Increment the manifest version for each new distribution; keep the lockfile and generated catalog release aligned. Packaging refuses existing versioned artifacts.
- Preserve user changes in CFG fixtures and do not execute them or modify the game installation as part of editor tests.
- Providers and future WebViews/builders consume shared registry and domain services. Do not add another command database, parser or interpretation of command parameters in a UI.
- The independent registry exists in `src/catalog/registry.ts`; documentation and the bounded single-file effective model live in `src/core/`. Extend these foundations incrementally within existing boundaries; avoid empty architectural scaffolding. Preserve explicit partial results for unknown actions and execs.
- Collect Source 2 candidates with `catalog:fetch -- --current`; review the diff and use `catalog:promote -- --reviewed <SHA>` explicitly. Never promote an upstream update automatically. Keep snapshot values separate from defaults and game-build verification.
- Keep analysis and documentation facts independent of VS Code; editor adapters render or apply their results.

## Behavior

- Preserve command order, quoted values and bind/alias bodies when formatting. Leave malformed quoted text unchanged.
- Treat fixture values as examples, not accepted ranges. Unknown game flags or behavior remain unknown.
- Keep original English game text separate from community summaries. Support pt-BR with English fallback.
- Never promote one console report to a removal claim for all builds or invent equivalent replacement commands.
- Do not add fixed catalog totals to guides or tests. Versions belong in the manifest and changelog.
- Avoid adding runtime dependencies without a concrete need. No network requests belong in the typing or formatting path.
- Preserve field-level evidence and build/context scope. Reject unresolved data conflicts instead of relying on merge order; separate lifecycle from flags and runtime verification.
- Bind/alias bodies are deferred. Effective-state analysis must preserve order, source history and uncertainty; do not treat every nested assignment as immediately executed.
- Formatting is separate from cleanup and migration. Existing-file builder edits preserve unrelated text and require a reviewable preview.
- Keep `cs2Config.*` settings compatible. Do not register future commands/settings before their feature works.
- Future WebViews use validated typed messages, restrictive CSP, scoped resources and accessible navigation; business rules stay in the domain.

## Version and release guardrails

- Distribution versions use `MAJOR.MINOR.PATCH` (`0.0.0`). Choose the increment by compatibility and user impact, not changed-line count or time spent.
- **PATCH**: compatible bug fixes, small refinements, translations, documentation/assets or reviewed catalog corrections without a new capability. Example: `0.0.2` → `0.0.3`.
- **MINOR**: a new user-facing capability or substantial compatible expansion of an existing feature. Example: `0.0.2` → `0.1.0`; reset PATCH to zero.
- **MAJOR**: incompatible changes to public settings, commands, supported behavior or formats without backward compatibility. Reset MINOR and PATCH to zero. While the project is below `1.0.0`, breaking changes require an explicit user decision and migration notes; never silently declare `1.0.0`. A stable `1.0.0` release is a separate product decision.
- When multiple changes ship together, use the highest required increment. Explain the classification before generating the release. An explicitly requested version takes precedence; identify any impact mismatch instead of silently substituting another version.
- Do not bump for each local edit. Bump when preparing a new distribution; development-only rules/tests/docs may remain pending for the next release. Never regenerate or alter an existing release to include later changes.
- Before packaging, synchronize the manifest, lockfile and generated catalog; move shipped changes from Unreleased into a dated changelog section. Preserve earlier release history and packages. Packaging rejects malformed numeric versions, existing artifacts and versions lower than already generated artifacts.
- Do not publish, create Git tags or use Marketplace credentials merely because a VSIX was requested.

## Verification

Every added, changed or removed user-facing feature must update documentation in the same change. Keep `README.md` and `docs/README.pt-BR.md` aligned as short benefit-focused feature overviews; settings, examples and detailed limits belong in the bilingual user guides. Record feature changes under `CHANGELOG.md` → Unreleased, and update planning/status when a milestone changes. Describe only implemented behavior and keep planned features clearly labeled.

For code/data changes, run the applicable source formatting, catalog generation, unit and style checks. Parser/diagnostic changes need behavioral regressions; source/schema changes need invalid-data and deterministic-generation checks. For editor provider changes, run `npm run test:integration` on Windows or review in the Extension Development Host. Run `npm run package` after changing runtime paths or assets and inspect what enters the VSIX. Documentation-only work needs link/style review rather than a full runtime test run.

Report the behavior changed, the checks performed and any unverified game assumptions. Keep changes scoped; publication, Marketplace credentials and external communications are separate tasks.
