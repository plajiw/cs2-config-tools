# Stabilization and polish pass

2026-10-02, America/Sao_Paulo. The current MVP stabilization increment is complete. No known P0/P1 audit finding remains pending in the supported scope. The [historical audit](full-project-audit-2026-10-02.md) remains unchanged; the [correction record](full-project-audit-2026-10-02-corrections.md) describes the earlier functional corrections.

## Hardening retained and completed

- **WRITE-001:** host destination/session generations, URI/source/version authorization and post-await checks remain protected by lifecycle regressions, including switching, cancellation and disposal.
- **WRITE-002:** bounded, identity-checked UTF-8 disk reads remain; this pass additionally rejects oversized unsaved buffers before copying text, including Apply freshness checks. A regression makes `getText` throw if that preflight is bypassed.
- **ANALYSIS-001 / DATA-001:** ordered alias facts, shared cycle findings and applicable cross-source constraint rejection were reconfirmed by behavioral/invalid-data tests. Deferred uncertainty and reviewed build differences remain explicit.
- **PERF-001 / DOMAIN-001:** bounded, deduplicated, cancellable links and reviewed whole-action shapes remain covered.
- **VERIFY-001:** unique profiles/output and primary-failure preservation remain. Repetition exposed premature undo/document and file-watcher snapshot assertions. Tests now focus the owned editor and await exact expected state with deadlines; undo is issued once. Three consecutive isolated Windows runs passed: `integration-gL6Fsr`, `integration-h5pFYO`, `integration-jkmZGq`.

The [entry checklist](../development-safety.md) now explicitly forbids rebuilding shared emitted modules during host acceptance and documents notification-aware assertions. Bilingual guides/status were aligned; corrupted Portuguese accents in safety documentation were repaired.

## Visual changes and review

Hub cards have regular spacing, aligned quick/row actions, primary connection/creation actions and a clearer light-theme Ready state. Filenames retain one-line identity with local table scrolling.

Video Settings pairs labels with original keys and keeps literal values visible at narrow widths. Read-only scope is prominent, resolution/frequency have a concise summary, and interpretation limits live in secondary details. Missing files show recovery text without an empty table. No enum meanings or editing capability were added.

Bind Map uses a symmetric shell, mirrored M1/M2, centered wheel/M3 and separate embedded M4/M5. Stroke scale and keyboard/mouse states remain shared; browser checks verify labels and unobstructed hit targets. The keyboard retains fixed scale and local scrolling. Builder secondary actions now leave add/review/apply prominent; its empty draft and disabled Apply remain intentional.

All listed host screenshots were inspected in Default Dark Modern and Default Light Modern, using isolated VS Code 1.96.4:

| Screen   | WebView widths    | Dark captures                                                                                                                                                                                                                                                                                    | Light captures                                                                                                                                                                                                                                                                                   |
| -------- | ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Hub      | 1872 / 1052 / 432 | [wide](../../.test-output/main-screens-host-VrGTlK/wide.png), [medium](../../.test-output/main-screens-host-VrGTlK/medium.png), [narrow](../../.test-output/main-screens-host-VrGTlK/narrow.png)                                                                                                 | [wide](../../.test-output/main-screens-host-faKZzH/wide.png), [medium](../../.test-output/main-screens-host-faKZzH/medium.png), [narrow](../../.test-output/main-screens-host-faKZzH/narrow.png)                                                                                                 |
| Video    | 1872 / 1052 / 432 | [wide](../../.test-output/main-screens-host-GPw9Bk/wide.png), [medium](../../.test-output/main-screens-host-GPw9Bk/medium.png), [narrow](../../.test-output/main-screens-host-GPw9Bk/narrow.png)                                                                                                 | [wide](../../.test-output/main-screens-host-cUo9dh/wide.png), [medium](../../.test-output/main-screens-host-cUo9dh/medium.png), [narrow](../../.test-output/main-screens-host-cUo9dh/narrow.png)                                                                                                 |
| Bind Map | 1872 / 1152 / 852 | [wide](../../.test-output/bind-map-host-6hebIc/wide-selected.png), [medium](../../.test-output/bind-map-host-6hebIc/medium.png), [narrow](../../.test-output/bind-map-host-6hebIc/narrow-selected.png)                                                                                           | [wide](../../.test-output/bind-map-host-FrxvL8/wide-selected.png), [medium](../../.test-output/bind-map-host-FrxvL8/medium.png), [narrow](../../.test-output/bind-map-host-FrxvL8/narrow-selected.png)                                                                                           |
| Builder  | 1872 / 1152 / 472 | [wide](../../.test-output/autoexec-builder-host-iTTohd/wide.png), [medium](../../.test-output/autoexec-builder-host-iTTohd/medium-preview.png), [narrow](../../.test-output/autoexec-builder-host-iTTohd/narrow-preview.png), [empty](../../.test-output/autoexec-builder-host-iTTohd/empty.png) | [wide](../../.test-output/autoexec-builder-host-hp659b/wide.png), [medium](../../.test-output/autoexec-builder-host-hp659b/medium-preview.png), [narrow](../../.test-output/autoexec-builder-host-hp659b/narrow-preview.png), [empty](../../.test-output/autoexec-builder-host-hp659b/empty.png) |

Hub/video host captures use production pages/assets and synthetic host models from shared core services, with the real VS Code bridge/CSP. They validate rendering; actual command/folder/userdata lifecycle is covered separately by integration. Bind Map/Builder captures open their actual extension commands against owned synthetic files. Browser matrices add 420px, keyboard, literal-injection, state and recovery assertions. Logs/measurements remain ignored under `.test-output/polish/` and each owned run.

## Checks and limits

Catalog generation/check, build, source formatting/style, all **97 unit tests**, both browser suites and three isolated integration runs passed. Early failed runs are retained: one overlapped a rebuilding `dist`; later failures exposed notification timing. They were not counted as acceptance passes or suppressed.

This closes the stabilization increment for the existing MVP. It does not complete specialized builders, multi-file semantics or a video editor. No game commands, installation files or user CFG fixtures were modified/executed. Enum/game applicability remains unverified. Screenshots and tests provide evidence, not a usability or architectural certification.

Remaining low-priority review: native action selectors can truncate long labels at narrow widths, although search, selected explanations and raw draft text remain available. Full screen-reader task studies and additional custom-theme review remain outside this pass.

## Local distribution

The user's standing request to apply updates in their usual VS Code authorizes the local update. Comparing the working tree's shipped runtime/assets with immutable 1.4.0 (`6BF999E2BD6ECF40A3426CA8D4ED2A415809547E1FF66C928DB8C390A8719874`) showed compatible bug fixes, visual refinements and documentation. The selected increment is **PATCH: 1.4.1**. Earlier artifacts are preserved; manifest, lockfile, generated catalog and dated changelog are aligned.

`npm run package` generated `artifacts/cs2-config-tools-1.4.1.vsix`, SHA-256 `A38E231218378B4A57C660D44152022C96C4834A22CA9598ACB2196103C72A32`. ZIP inspection confirmed required runtime paths/assets and byte-for-byte correspondence with tested runtime/resources/catalog, excluding source data, fixtures, tests, profiles and audit documents. The extracted extension passed provider host acceptance in isolated VS Code 1.96.4 (`integration-8i09rv`). Release catalog/build, 97 unit tests and style passed again; documentation style and 80 local links passed review.

The usual local VS Code CLI successfully installed the new VSIX and confirmed **`plajiw.cs2-config-tools@1.4.1`**. An already running extension instance may require **Developer: Reload Window**. No Marketplace publication or Git tag occurred.
