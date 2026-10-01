# Preview release validation

Validated on 2026-10-01 on Windows. The version and publisher are recorded in `package.json`; the VSIX is generated under `artifacts/`. The manifest marks this initial distribution as a preview. The README was left unchanged during release preparation.

## Results

- Unit suite passed, including catalog reproducibility, invalid data, parser, formatter, documentation, effective state and bind map regressions.
- Source style checks passed.
- Browser renderer checks passed with actual keyboard input, English/pt-BR, reference themes, narrow layout and CSP/literal rendering checks.
- Extension Host integration passed in an isolated official VS Code 1.96.4 installation. The personal editor's pending update was left untouched.
- The same integration suite passed against the files extracted from the final VSIX, including completion, bilingual hover, definitions, links, diagnostics, CFG fixture coverage, quick fixes, references, inlays, health, map creation and document/selection formatting.
- Package inspection confirmed the runtime/catalog/WebView assets and excluded source, scripts, fixtures, candidates, cache and test profiles.

For the isolated host set `CS2_CFG_VSCODE` to its executable. To validate an artifact, extract the VSIX and set `CS2_CFG_EXTENSION_PATH` to its `extension/` directory, then run `npm run test:integration`. Tests use a separate editor profile and never execute CFGs or modify the game installation.

## Publication scope

The package is a candidate for the initial preview publication. The initial upload reported a publisher mismatch; the manifest now uses the user's Marketplace publisher, `plajiw`. The extension identifier is `plajiw.cs2-config-tools`, also used in formatter examples. Integration derives this identifier from the manifest to avoid stale publisher references. No Marketplace upload was performed by the development agent.

These checks establish the tested behavior, not universal correctness. Game-build compatibility, runtime command behavior, external CFG evaluation and every OS/editor/theme combination remain outside this validation. The browser uses a simulated bridge; map navigation/lifecycle are covered by adapter regressions, and map creation by real host integration. There is no claim of full manual WebView or accessibility certification.
