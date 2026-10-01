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
npm run package
```

`npm run catalog:check` catches changes to catalog sources that were not regenerated. Tests check behavior rather than an exact catalog size, so adding commands does not require updating arbitrary totals.

Use F5 after building for a manual review. On Windows, `npm run test:integration` uses the local VS Code executable; adjust `scripts/test-vscode.ps1` if it is installed elsewhere. The test runs in a separate profile and does not alter the machine's PowerShell execution policy.

Set `CS2_CFG_VSCODE` to an isolated VS Code executable when the installed editor is unavailable. Set `CS2_CFG_EXTENSION_PATH` to the extracted `extension/` folder of a VSIX to run the same integration suite against the packaged files. The workspace fixtures and test profile remain separate from the game installation.

For the bind map renderer, `npm run test:webview` uses a local Chromium browser (Microsoft Edge on Windows by default). Set `CS2_CFG_BROWSER` to another Chromium executable if needed. It creates an isolated browser profile and writes screenshots/report under `.test-output/bind-map-browser/`. This checks real DOM, keyboard input and reference themes with a simulated VS Code bridge; still run the Extension Host integration for editor behavior. See the [validation record](docs/planning/bind-map-validation.md).

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

Document every added, changed or removed user-facing feature in the same change:

- Update the English and pt-BR README feature descriptions when capabilities change. Keep these as concise user-facing overviews rather than implementation notes.
- Update the [English user guide](docs/user-guide.md) and [pt-BR guide](docs/user-guide.pt-BR.md) for usage, settings, examples and relevant limits.
- Add an entry under **Unreleased** in `CHANGELOG.md`. Update planning/status when the milestone changes.

Explain what users can do and how to use it. Describe available features separately from planned work; avoid fixed catalog totals and claims of game verification without evidence.

The files in `tests/fixtures/` are user-supplied reference configurations. Preserve local edits and review personal information before publishing the repository. Fixtures, source evidence, logs and planning documents are excluded from the extension package. Generated builds belong in `dist/` and distributable packages in `artifacts/`.

Describe what changed and how you checked it. Keep version details in `package.json` and release history in `CHANGELOG.md`; public guides should explain the project without depending on catalog counts.
