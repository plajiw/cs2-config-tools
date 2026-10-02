# Contributing to CS2 Config Tools

Start with a small change and a concrete example: a CFG that formats poorly, a missing description, a translation that reads awkwardly or a diagnostic that misidentifies a command. Explain the expected behavior so another contributor can reproduce it.

Read the [project vision](PROJECT_VISION.md), [architecture](docs/architecture.md) and [implementation plan](docs/planning/implementation-plan.md) before adding a subsystem. Language tooling comes before visual builders; all interfaces share command data and domain services. The [audit](docs/planning/architecture-audit.md) identifies current gaps. Agent-assisted contributions also follow [AGENTS.md](AGENTS.md).

## Find the right place

| Change                                          | Location                               |
| ----------------------------------------------- | -------------------------------------- |
| Parsing, completion context or formatting rules | `src/core/`                            |
| Editor providers, configuration and lifecycle   | `src/vscode/`                          |
| Command descriptions and evidence               | `catalog/source/`                      |
| Highlighting and language configuration         | `resources/`                           |
| Behavioral tests                                | `tests/unit/` and `tests/integration/` |
| Contributor guides and plans                    | `docs/`                                |

Keep `src/extension.ts` focused on activation. The core must remain independent of the VS Code API. Prefer a named helper over a long block that mixes parsing, UI and configuration.

## Run the checks

```sh
npm ci
npm run catalog
npm run format:source
npm test
npm run check:style
```

Packaging is separate release work and requires an explicit request; see the release rules below.

`npm run catalog:check` catches changes to catalog sources that were not regenerated. Tests check behavior rather than an exact catalog size, so adding commands does not require updating arbitrary totals.

Use F5 after building for a manual review. On Windows, `npm run test:integration` uses the local VS Code executable; adjust `scripts/test-vscode.ps1` if it is installed elsewhere. The test runs in a separate profile and does not alter the machine's PowerShell execution policy.

Set `CS2_CFG_VSCODE` to an isolated VS Code executable when the installed editor is unavailable. Set `CS2_CFG_EXTENSION_PATH` to the extracted `extension/` folder of a VSIX to run the same integration suite against the packaged files. The workspace fixtures and test profile remain separate from the game installation.

For the bind map renderer, `npm run test:webview` uses a local Chromium browser (Microsoft Edge on Windows by default). Set `CS2_CFG_BROWSER` to another Chromium executable if needed. It creates an isolated browser profile and writes screenshots/report under `.test-output/bind-map-browser/`. This checks real DOM, keyboard input and reference themes with a simulated VS Code bridge; still run the Extension Host integration for editor behavior. See the [validation record](docs/planning/bind-map-validation.md).

For the Config Hub, run `npm run test:hub-webview` to check the production Home in Chromium with a simulated editor bridge. Captures in `.test-output/config-hub-browser/` cover dark/light themes and desktop/narrow layouts. Folder persistence, unsaved-buffer analysis and exclusive creation are also covered in Extension Host integration using temporary synthetic CFGs, never the game directory.

For visual acceptance in the real editor, run `npm run test:bind-map-host`. Set `CS2_CFG_VSCODE` to the Windows VS Code executable (the default is the cached 1.96.4 test installation). It opens an isolated Extension Development Host with a synthetic CFG, captures narrow/medium/wide layouts and selected-input details, and checks document overflow, mouse size and inspector placement. Captures and measurements go to a unique `.test-output/bind-map-host-*` directory. Set `CS2_BIND_VISUAL_THEME` to `Default Light Modern` for the light-theme pass. Review the images in addition to the assertions; see the [refinement record](docs/planning/bind-map-visual-refinement.md).

## Commands and translations

Edit `catalog/source/descriptions.json`, then regenerate the catalog. Keep command names and accepted parameter literals unchanged across languages. English is the source language for community summaries; pt-BR translations should read naturally while preserving meaning.

Run `npm run catalog:fetch` to request a community console inventory through the GitHub API. Candidates are saved to `.cache/community/candidates.json` with an immutable revision, source date and content hash. The fetch does not change the published catalog. Review fields into `catalog/source/parameters.json`, add bilingual value labels and useful examples, then run `npm run catalog`. The first reviewed snapshot is dated May 2025 and is not a claim about the latest CS2 build. The upstream repository declares CC0; original game help and other imported sources still need appropriate attribution and review. The Valve Developer Community API was inaccessible during this investigation.

For behavior claims, provide the game build, platform, client/server context, cheats state, exact input and observed output. A name found in a CFG proves an example exists, not that the latest game accepts it. Label original game help separately from community writing and retain attribution for imported sources.

## Formatter changes

For Source 2 research, run `npm run catalog:fetch -- --current`. It resolves a repository commit, then fetches **both** dumps at that exact SHA into `catalog/candidates/`. Use `--revision <full SHA>` to reproduce a specific snapshot. Review `UPDATE_REPORT.md`, `diff.json`, raw evidence and `index.json`. Missing entries are observations, not removal claims. Candidates are ignored by Git and excluded from the VSIX.

After reviewing the technical snapshot, run `npm run catalog:promote -- --reviewed <exact candidate SHA>`, then `npm run catalog`. Promotion verifies raw hashes and reparses both files before writing `catalog/source/technical.json`; it does not execute the game or curate human descriptions. Technical metadata, reviewed parameter meanings and translations remain separate. Never promote simply because an upstream commit changed. See [data sources](docs/data-sources.md).

Reviewed crosshair explanations belong in `catalog/source/crosshair.json`. Keep hidden status distinct from a verified compatibility alias and preserve the reference revision. See [crosshair notes](docs/crosshair.md).

Add a regression example. Check that formatting twice gives the same result and that command order, quoted values, comments and deferred bind/alias bodies survive. Cover CRLF and incomplete text when relevant. Formatting must not deduplicate commands, rewrite values or attempt to repair broken strings.

## Before sharing

Treat generated releases as immutable. Increment the version in `package.json` and `package-lock.json`, regenerate the catalog and record the release in `CHANGELOG.md` before distributing another package. `npm run package` writes a new versioned VSIX under `artifacts/` and refuses to overwrite an existing file. Keep older packages; do not delete one to rebuild the same version.

Always generate a distribution or bump its version only when explicitly requested. Requests to implement, fix, test or finish work do not authorize a release. Otherwise keep changes in development and Unreleased, verify through builds/tests or the Extension Development Host, and leave existing packages untouched. Once a release is requested, the agent chooses the numerical increment from the accumulated diff since the previous release, including staged/unstaged/untracked changes, relevant commits and Unreleased notes. Do not assume HEAD is the released baseline.

Choose `MAJOR.MINOR.PATCH` by impact: patch for compatible fixes/refinements, minor for new capabilities or substantial compatible expansion, and major for incompatible public behavior/settings/formats. Minor resets patch; major resets both. Use the highest impact in a combined release, not its line count. Document migration needs for breaking changes; a major number does not authorize removing preview status or declaring production readiness. Explain the chosen increment before generating the requested package. Local edits do not each need a release. Document shipped changes in a dated changelog section; never rebuild an old version to add them. See [agent release rules](AGENTS.md#version-and-release-guardrails).

Document every added, changed or removed user-facing feature in the same change:

- Update the English and pt-BR README feature descriptions when capabilities change. Keep these as concise user-facing overviews rather than implementation notes.
- Update the [English user guide](docs/user-guide.md) and [pt-BR guide](docs/user-guide.pt-BR.md) for usage, settings, examples and relevant limits.
- Add an entry under **Unreleased** in `CHANGELOG.md`. Update planning/status when the milestone changes.

Explain what users can do and how to use it. Describe available features separately from planned work; avoid fixed catalog totals and claims of game verification without evidence.

The files in `tests/fixtures/` are user-supplied reference configurations. Preserve local edits and review personal information before publishing the repository. Fixtures, source evidence, logs and planning documents are excluded from the extension package. Generated builds belong in `dist/` and distributable packages in `artifacts/`.

Describe what changed and how you checked it. Keep version details in `package.json` and release history in `CHANGELOG.md`; public guides should explain the project without depending on catalog counts.

For Autoexec Builder visual acceptance, run `npm run test:builder-host`. This opens an isolated Extension Development Host with synthetic CFGs, checks conflicts/cancel/apply, undo and stale-source rejection, and captures narrow/medium/wide layouts under a unique `.test-output/autoexec-builder-host-*` directory. It never executes CFGs or modifies the game installation.

## Incremental safety review

Use the [feature entry checklist](docs/development-safety.md) for changes involving writes, semantics, filesystem work or WebViews. Architectural changes need a demonstrated problem. Passing tests and screenshots are evidence with limits, not proof of architecture or UX quality.
