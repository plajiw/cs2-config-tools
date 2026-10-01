# Bind map validation

Reviewed on 2026-10-01 on Windows, Node 22.23.3 and Edge 154.0.4258.48. This increment refines the read-only map; it does not introduce a builder or validate CS2 runtime behavior.

## Checks performed

- Unit regressions cover same-version source switches, navigation during asynchronous editor opening, stale clicks after edits, oversized files, source closure and disposal.
- Standalone Chromium tests use the production HTML, CSS and JavaScript with a simulated VS Code bridge and restrictive CSP. Enter/Space select binds, Tab reaches navigation buttons, and action updates preserve focus by key.
- The browser checks literal rendering of HTML-like action text, source switch/closure, English/pt-BR and a narrow viewport without horizontal overflow. CSP violations and JavaScript exceptions fail the run.
- Captures were inspected at desktop and narrow widths, with reference dark, light and high-contrast colors. Borders, focus and uncertainty labels remain visible. This is a visual review, not a full accessibility audit or verification of every editor theme/screen reader.

Run `npm run test:webview` to reproduce the renderer checks. Set `CS2_CFG_BROWSER` to a Chromium executable when Edge is unavailable. Artifacts stay in `.test-output/bind-map-browser/` and are excluded from distribution. The runner uses synthetic CFG text and a separate browser profile, never the game installation or personal browser profile. Its DevTools calls follow the [Chromium protocol](https://chromedevtools.github.io/devtools-protocol/).

## Remaining host checks

`npm run test:integration` was retried, but the installed VS Code refused to start because it is being updated. The browser checks do not establish that the real WebView bridge, editor focus and navigation work in the Extension Development Host. Repeat integration and review with an actual CFG once the editor can launch. Phase 8 remains pending that host review; builders remain the next roadmap increment.
