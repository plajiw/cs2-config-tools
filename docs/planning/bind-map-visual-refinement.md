# Bind Map visual refinement — 2026-10-02

The layout is included in the existing local 1.3.0 distribution. This review did not generate or overwrite a VSIX; it verified the package's runtime assets against the working tree and installed that package locally. This validation record remains a documentation change for the next release.

The supplied reference guides hierarchy and proportions. The implementation keeps native VS Code theme colors, the existing read-only model and explicit uncertainty. No game commands are executed or real game files changed.

## Iteration log

| Iteration | Observed problem | Change and review result |
| --- | --- | --- |
| Baseline | Small mouse, detached side buttons, inspector wasted space beside the devices. | Captured the production WebView in an isolated Extension Development Host at narrow, medium and wide widths. |
| 1 | Device proportions and inspector hierarchy needed improvement. | Added dedicated device sections, a larger mouse, integrated M1–M5, adjacent wheel controls and an inspector below at every width. Reviewed all three widths. |
| 2 | Action rows did not explain assigned actions; wide mouse text was crowded. | Added shared-model explanations and category markers, increased mouse-section space and aligned source navigation with the selected command. Reviewed all widths and selection states. |
| 3 | VS Code's default body padding left a small unnecessary keyboard scrollbar at the wide width. | Set explicit page padding, preserving the 1080px keyboard. Wide now fits completely; smaller widths retain local keyboard scrolling. Reviewed final dark/light captures and selected-input states. |

## Final real-editor review

Windows VS Code 1.96.4, isolated profile and synthetic CFG copied from the fixture with additional mouse bindings, reassignment and an unresolved exec. CDP resizes the actual editor renderer; these are Extension Development Host captures, not a simulated WebView bridge. Workbench widths are 900, 1200 and 1920px; effective WebView widths are below.

| Layout | WebView width | Keyboard / viewport | Mouse surface | Result |
| --- | --- | --- | --- | --- |
| Narrow | 852px | 1080 / 773px | 260px | Devices stack; filters collapse; local keyboard scroll; no page overflow. |
| Medium | 1152px | 1080 / 879px | 260px | Sidebar remains; devices stack; inspector below; no page overflow. |
| Wide | 1872px | 1080 / 1120px | 240px | Devices share a row; full keyboard visible without scrolling; inspector spans the page. |

Final local captures (ignored test artifacts):

- Dark: [wide](../../.test-output/bind-map-host-ZlW4U2/wide.png), [medium](../../.test-output/bind-map-host-ZlW4U2/medium.png), [narrow](../../.test-output/bind-map-host-ZlW4U2/narrow.png), [selected input](../../.test-output/bind-map-host-ZlW4U2/narrow-selected.png), [measurements](../../.test-output/bind-map-host-ZlW4U2/measurements.json).
- Light: [wide](../../.test-output/bind-map-host-avdNNo/wide.png), [medium](../../.test-output/bind-map-host-avdNNo/medium.png), [narrow](../../.test-output/bind-map-host-avdNNo/narrow.png), [selected input](../../.test-output/bind-map-host-avdNNo/medium-selected.png).

Review confirmed readable labels, side buttons inside the mouse silhouette, distinct wheel controls, consistent category dots and selected-input details below. Medium/narrow layouts intentionally need vertical scrolling to reach details; selection moves focus there. Truncated action explanations retain full accessible text/tooltips. Startup notices were dismissed after extension activation for the final dark captures.

## Verification and limits

Catalog generation/check, build, 78 unit tests, source style check, browser smoke and Windows Extension Host integration passed. Browser tests also cover Enter/Space selection, focus preservation, category/state filters, literal entries, source messages and geometry. The real-editor harness verifies actual model-fed M4 selection, no document overflow, mouse size and inspector placement, and captures selected states at all widths.

Run `npm run test:bind-map-host`; set `CS2_BIND_VISUAL_THEME=Default Light Modern` for the light pass. See [contributing](../../CONTRIBUTING.md) for the executable override. Screenshots were visually inspected, rather than accepted solely from assertions. High-contrast colors follow theme variables but were not manually reviewed in this matrix; no screen-reader or game-runtime validation is claimed. This does not certify every third-party theme or the user's installed editor version.
