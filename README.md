# CS2 Config Tools

<p align="center">
  <img src="resources/icons/cs2-config-tools.png" width="112" alt="CS2 Config Tools logo" />
</p>

<p align="center">
  <strong>A VS Code toolkit for understanding, validating, visualizing and organizing Counter-Strike 2 CFG files.</strong>
</p>

<p align="center">
  <a href="https://github.com/plajiw/cs2-config-tools/actions/workflows/ci.yml"><img alt="Checks" src="https://github.com/plajiw/cs2-config-tools/actions/workflows/ci.yml/badge.svg" /></a>
  <img alt="Status" src="https://img.shields.io/badge/status-preview-orange" />
  <img alt="VS Code" src="https://img.shields.io/badge/VS%20Code-%E2%89%A51.96-007ACC" />
  <a href="LICENSE"><img alt="License" src="https://img.shields.io/badge/license-MIT-green" /></a>
</p>

---

## Overview

CS2 Config Tools brings Counter-Strike 2 configuration workflows into VS Code with language tooling, static analysis and visual inspection built on a shared command registry.

The project is designed for both players who simply want to understand and manage their configuration and experienced users who maintain larger `autoexec.cfg`, bind, alias and practice setups.

The interface favors human-readable meaning while keeping the underlying CS2 commands visible and accessible.

## Current features

- **Command Explorer** — search shared command documentation and copy command names.
- **Saved video settings** — inspect Steam userdata with readable labels, original keys and literal values, including in narrow panels. Open authorized files for manual text editing.
- **Configuration Hub** — connect a CS2 CFG folder, browse configuration files and access analysis tools from one place.
- **Autoexec Builder** — create simple keyboard/mouse binds, search human meanings, review conflicts and human/raw diffs, then apply source-preserving edits.
- **Visual Bind Map** — inspect keyboard, mouse and numpad bindings with categories, source navigation, reassignment history and uncertainty states.
- **CFG Health Check** — review syntax, command, parameter and bind findings in one report.
- **Autocomplete** — discover known commands, ConVars and values while typing, with automatic language recognition in CS2 CFG directories.
- **Hover documentation** — see descriptions, current values, known defaults, ranges and reviewed value meanings.
- **Diagnostics and quick fixes** — identify unknown commands, unfinished strings, invalid values and nearby command-name corrections.
- **Alias navigation** — jump to local alias definitions and find references.
- **`exec` navigation** — open referenced CFG files when they can be resolved locally.
- **Document formatting** — normalize spacing and section layout without changing command order or quoted content.
- **Optional inlay hints** — show reviewed parameter meanings directly in the editor.

## Product direction

CS2 Config Tools is evolving toward a complete configuration workbench rather than a standalone CFG generator.

Planned capabilities include:

- broader visual editing of `autoexec.cfg`;
- safe bind editing using the same keyboard and mouse components as the Bind Map;
- crosshair, radar, viewmodel, practice and alias builders;
- a Config Doctor for explaining why a configuration does not behave as expected;
- multi-file `exec` relationships and effective-state tracing;
- CS2 update compatibility and migration assistance;
- broader Steam saved-settings models and reviewed visual editing;
- previewable, source-preserving edits with diff and backup flows.

The detailed product vision is documented in [`FEATURES.md`](FEATURES.md). Implementation order and current status remain tracked separately in the planning documents.

## Design principles

```text
Understand  →  Visualize  →  Diagnose  →  Create / Edit  →  Maintain
```

- One interface instead of separate beginner and advanced modes.
- Human meaning first; raw CFG remains available.
- Shared metadata and analysis across editor tooling and visual features.
- No silent file replacement.
- No unverified migration claims or invented command semantics.
- Visual tools build on parser, registry and analysis foundations instead of duplicating them.

## Project status

The project is currently in **preview**.

Implemented foundations include the command registry, CFG parser, completion, hover, diagnostics, formatter, local effective analysis, health reporting, the Configuration Hub, the read-only Visual Bind Map and the Autoexec Builder MVP.

Workspace-wide analysis, specialized builders, broader source editing and migration workflows remain incremental future work.

See [`docs/planning/status.md`](docs/planning/status.md) for the current implementation state.

## Documentation

- [`FEATURES.md`](FEATURES.md) — integrated product and feature vision
- [`PROJECT_VISION.md`](PROJECT_VISION.md) — core architecture and development principles
- [`docs/architecture.md`](docs/architecture.md) — architecture and responsibilities
- [`docs/command-database.md`](docs/command-database.md) — command registry and metadata contracts
- [`docs/data-sources.md`](docs/data-sources.md) — evidence and provenance
- [`docs/planning/roadmap.md`](docs/planning/roadmap.md) — roadmap
- [`docs/planning/implementation-plan.md`](docs/planning/implementation-plan.md) — phased implementation plan
- [`docs/planning/status.md`](docs/planning/status.md) — current project status
- [`CONTRIBUTING.md`](CONTRIBUTING.md) — contribution guide

## Development

```bash
npm install
npm run build
npm test
```

Useful checks:

```bash
npm run check:style
npm run catalog:check
npm run test:webview
npm run test:hub-webview
npm run package
```

The core editing experience is designed to work offline. Catalog imports are explicit development operations rather than runtime dependencies.

## Contributing

Contributions are welcome, especially when they improve command evidence, descriptions, language tooling, diagnostics, accessibility or real CS2 configuration workflows.

Please read [`CONTRIBUTING.md`](CONTRIBUTING.md) before opening a pull request.

If you find a bug or a confusing command description, open an issue with a minimal CFG example and, when relevant, the CS2 build/context used to reproduce it.

## Community

[Report a bug](https://github.com/plajiw/cs2-config-tools/issues) · [Feature ideas](https://github.com/plajiw/cs2-config-tools/issues) · [Português](docs/README.pt-BR.md)

## License

Code in this repository is licensed under the [MIT License](LICENSE).

Imported or derived data keeps its original source attribution and applicable terms.
