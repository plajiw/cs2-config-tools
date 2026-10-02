# Autoexec Builder MVP — validation and scope

Development milestone, 2026-10-02. No version bump, packaging, installation or game execution is part of this change.

## Implemented slice

- Hub Quick Actions and Tools entry; explicit existing/new CFG destination selection, with existing-file editing instead of replacement.
- Structured simple key/mouse binds; registry-backed bilingual action search and parameters. Alias actions, nested command sequences and quoted/escaped arguments are intentionally unsupported.
- Shared community inventory meanings for slot1–slot13, with source, confidence, strength, review date and contextual notes. slot13 keeps its technical primary name. Original help and snapshot/runtime facts stay separate.
- Preview validation: key support, command availability, known ConVar constraints, duplicate/case-ambiguous keys, existing reassignment approval, alias shadows and uncertain/contextual commands.
- Human changes, raw snippets and full read-only editor diff. Explicit acknowledgement of uncertainty; cancel/close has no write.
- Localized action-token edits or appended binds preserve comments, unrelated text, quotes, ordering, line endings and final-newline presence. Indirect/uncertain effective writes receive an appended explicit override instead of editing a deferred definition.
- Existing editor edits use undo stops and remain unsaved. New files are created exclusively via WorkspaceEdit. Buffer version/text and disk text are checked against the preview; stale destinations require a fresh review.

## Reproduction

Run `npm test`, `npm run check:style`, `npm run test:integration`, `npm run test:webview`, `npm run test:hub-webview` and `npm run test:builder-host`. Set `CS2_CFG_VSCODE` to the isolated cached VS Code executable when the installed editor is unavailable. Node is available in the local project toolchain; no new runtime dependency was added.

Unit coverage includes the shared semantic labels, human/technical search, Bind Map projection, provenance validation, safe serialization, blocking conflicts and injection, malformed input, LF/CRLF, comments/quotes/unrelated source, alias-origin overrides and stale previews. Extension Host tests exercise actual undo, unsaved edits, buffer/disk staleness, exclusive creation and hover.

The visual runner opens production assets in a real isolated Extension Development Host, checks an existing CFG conflict, human/raw previews and cancellation, then opens an empty CFG and adds movement, mouse and inventory binds. Narrow/medium/wide captures and measurements are written under a unique `.test-output/autoexec-builder-host-*` directory. Review the screenshots as well as the assertions.

## Completed checks

| Check                                                    | Result                                                                                                     |
| -------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| Catalog generation and reproducibility                   | Passed                                                                                                     |
| TypeScript build and unit regressions                    | Passed; 86 tests                                                                                           |
| Source/document formatting and local documentation links | Passed                                                                                                     |
| Windows Extension Host integration                       | Passed, including builder undo, stale buffer/disk rejection, exclusive creation and shared hover           |
| Bind Map Chromium regression                             | Passed                                                                                                     |
| Hub Chromium regression                                  | Passed, including the Builder entry's typed action                                                         |
| Builder real-host visual and functional review           | Passed: existing/empty CFG, conflicts, human/raw preview, cancel, keyboard/mouse/inventory binds and apply |

Final dark-theme captures are in `.test-output/autoexec-builder-host-t4q3J0/`: `wide.png`, `medium.png`, `narrow.png`, matching `*-preview.png`, `conflict.png`, `empty.png`, `empty-preview.png` and `measurements.json`. Host window widths were 1920/1200/520 px; actual WebView widths were 1872/1152/472 px, with no document overflow. Screenshots were inspected; the final narrow layout gives the action its own readable row above replacement/removal controls. Tests use cached VS Code 1.96.4 and Node 22.23.3 on Windows. The integration cleanup retries a transient Windows directory-watcher lock without deleting unknown files.

## Evidence limits

The supplied milestone mapping is reviewed community curation, not independent runtime evidence. No CS2 build was exercised. Inventory availability, exact melee cycling, Zeus participation and mode-specific items remain contextual or unverified. External execs and dynamic effects remain explicitly partial; this feature does not calculate a global game state. Destructive replacement/backups, general alias editing and specialized builders remain future work.
