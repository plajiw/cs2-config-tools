# User guide

Settings and detailed behavior for CS2 Config Tools. For a feature overview, see the [README](../README.md).

[Guia em portugu?s](user-guide.pt-BR.md)

## Start using it

Install the `.vsix` from `artifacts/` using **Extensions → … → Install from VSIX**. Open a CFG and select **CS2 CFG** in the language selector. The extension offers command suggestions, hover documentation, local alias definitions and links to files referenced by `exec`.

CFG is used by many applications, so associate files explicitly in your CS2 workspace:

```json
{
  "files.associations": { "*.cfg": "cs2cfg" },
  "cs2Config.descriptionLanguage": "pt-BR",
  "[cs2cfg]": {
    "editor.defaultFormatter": "plajiw.cs2-config-tools",
    "editor.formatOnSave": true
  }
}
```

The version in `package.json` identifies the current extension build. The project and catalog will grow as contributors add evidence and features.

## Config hub

Click **CS2 Config Tools** in the Activity Bar and choose **Home**, or run **CS2 Config: Open Home**. Use **Detect automatically** to search common Steam locations and the libraries declared by Steam, including other drives. **Choose folder** always allows manual selection.

Before listing CFGs, the extension asks you to allow the selected directory. A custom folder outside `game/csgo/cfg` is supported and labeled accordingly. The canonical folder is remembered locally for the next session; **Disconnect** removes that choice. Connected means the directory is accessible, not that CS2 is running or its build was verified.

The sidebar lists CFG files and the Home offers file opening, the read-only **Visual Bind Map** and **Health Check**. Files opened through the hub use CS2 CFG language mode. Analysis includes unsaved text from open editors and refreshes after edits or file changes. **Refresh** retries an unavailable folder. **Open in Explorer** reveals the connected directory.

**New CFG** creates an empty file after you review its name and destination. Existing files are never overwritten, even if another process creates the same name during the dialog. Creation requires a trusted workspace. Edit existing configurations in VS Code's text editor; the hub does not execute commands or save your edits automatically.

Overview counts are sums of independent single-file analyses, not a merged configuration or the running game's state. Each row distinguishes a partial result from the modeled subset. No “Valid” certification is shown. Only the first 100 regular CFG files directly in the folder are listed; nested directories and symbolic links are excluded. Files exceeding the existing analysis limit or inaccessible files have no summary and are excluded from analyzed totals. The hub's selected directory does not change the `cs2Config.cfgRoot` setting used by exec links.

Autoexec, Practice, Alias Builder and Command Explorer cards are labeled **Planned** and disabled. They illustrate the next interfaces; visual bind editing and configuration generation are not available in this MVP. See [feature status](../FEATURES.md).

## Formatting

Use **Format Document** (Shift+Alt+F on Windows) or **Format Selection**. The formatter normalizes spaces outside quotes, spaces semicolon separators, reduces repeated blank lines and can separate comment section headers.

```cfg
// Before
  sensitivity    "1.40"
rate  1000000;fps_max  "0"

// After
sensitivity "1.40"
rate 1000000; fps_max "0"
```

Quoted values, bind/alias bodies and `echo` text retain their content. Commands stay in their original order. Files containing unclosed strings are left unchanged. Selection formatting works on complete physical lines, so it will not rewrite a fragment inside a bind.

| Setting                                   | Default | Purpose                                          |
| ----------------------------------------- | ------- | ------------------------------------------------ |
| `cs2Config.formatting.maxBlankLines`      | `1`     | Limit consecutive blank lines; accepts 0–3       |
| `cs2Config.formatting.separateSections`   | `true`  | Separate comment headers using `===` or `---`    |
| `cs2Config.formatting.insertFinalNewline` | `true`  | Add a final newline when formatting the document |

## Documentation and diagnostics

English is the default description language. Choose `pt-BR` or `auto` in settings, or run **CS2 Config: Select Description Language**. `auto` follows the editor and falls back to English. `cs2Config.showOriginalDescription` also displays original English game help when available.

Hover shows a short description, known parameter values and a useful example. Commands with reviewed metadata also show a compact link to the source snapshot. HUD color values and selected telemetry settings have labeled choices in completion. Original game help, build compatibility, parameter limits and cheats flags are still being collected; source dates do not identify your installed build. A command missing from the catalog might belong to a plugin or an alias defined elsewhere.

`exec` links use the current CFG directory or the absolute directory in `cs2Config.cfgRoot`. Local aliases resolve within the current document; the extension does not simulate state across executed files.

An optional `cs2Config.consoleEvidence` profile records crosshair commands rejected in a supplied console report. It describes that observation without claiming removal in every build or converting names and values automatically.

All editing features work offline. The extension does not execute game commands or write to the game installation. Language analysis and formatting skip oversized files to keep the editor responsive.

The technical index includes both ConVars and executable commands from a pinned Source 2 dump via SteamTracking/GameTracking-CS2. This is tracked technical evidence, not official Valve documentation or verification against your installed build. Hover uses separate labeled blocks for **Current value** (written in that instruction), **Default** (reviewed metadata) and **Allowed range**. Enum/boolean meanings accompany the values. A dump value is labeled **Observed value** in technical details; it never becomes a current value or default by inference. Symbols without community documentation can still be recognized.

Flags and source links follow usage information. `cs2Config.hoverDetails` defaults to `standard`; choose `advanced` to include technical kinds/types and field provenance. A current value inside a bind or alias body describes the written instruction, not an executed change or the effective game state. Missing fields are omitted; queries and autocomplete documentation do not invent current values.

`cs2Config.completionMode` defaults to `normal`, which omits symbols explicitly flagged `hidden`, `developmentonly` or `internal` from suggestions. Select `advanced` to include them. Recognition and hover cover both modes; visibility is not a claim that a command is safe or executable in every context.

## Analysis and navigation

Known ConVar values receive warnings for reviewed types, choices and evidenced ranges. The game may clamp out-of-range values; these checks do not verify the installed build. Disable them with `cs2Config.parameterValidation` if needed. ConVar queries remain valid without a value.

Use the editor's Quick Fix menu on an unknown name for nearby known-name suggestions. Corrections change only the selected token and require selection; they do not migrate commands or convert values. The outline includes local alias/bind definitions and ConVars. Local alias definitions and references respect preceding definitions for immediate uses; deferred bodies use document-level references, not a prediction of when a key will be pressed.

Enable `cs2Config.inlayHints` to display reviewed meanings such as HUD colors next to literal values. It is disabled by default and follows the description language.

Run **CS2 Config: Check CFG Health** from the Command Palette while a CS2 CFG is active. The Output panel shows syntax/parameter findings, modeled binds/aliases and unresolved effects. This is single-file static analysis: `exec`, dynamic commands, cycles and budgets produce partial results. The report does not execute CFGs, score game performance or describe the current game state. Its checks are a full report, independent of whether individual editor warnings are hidden.

The shared effective model retains ordered assignment/bind history, handles `unbind`/`unbindall` and expands resolvable local aliases with limits. Assignments inside a bind or alias declaration are deferred. Workspace execution and context/cheats validation are still planned.

Repeated binds receive informational notices: identical action text is a repetition, different text replaces the preceding binding. Each notice links to the prior binding; changes made by a local alias point to the call and its definition. Set `cs2Config.bindDiagnostics` to `off`, `information` (default) or `warning`. The health report includes replacement/repetition counts even when editor notices are off.

Comparisons stop at unresolved effects and restart after explicit writes. `unbind` and `unbindall` reset the affected binding history used for comparison; deferred keypress bodies are not executed. Key names and action text are compared literally. A replacement can be intentional, and no automatic deletion or cleanup is offered.

## Visual bind map

With a CS2 CFG active, click the keyboard icon in the editor title bar, or run **CS2 Config: Open Bind Map**. Select the **CS2 CFG** language first if the file opened as plain text. The panel follows that file, including unsaved changes; activate another CFG and run the command again to switch sources.

- **Explore your inputs:** select any key on the proportional ANSI keyboard, its numpad or the mouse. The mouse includes five buttons and both scroll directions. Inputs missing from this analysis show "No binding found"; they may still have bindings in the game.
- **Understand a bind:** the inspector puts the available catalog explanation before the literal action, then shows its category and source line. Expand **Raw bind** for the original statement. **Binding history** appears only when there are multiple assignments. Descriptions follow cs2Config.descriptionLanguage, with English fallback. Aliases and sequences that cannot be safely classified appear as custom; slot names retain generic explanations when a specific item mapping is undocumented.
- **Find the source:** use **Open source**, **Open alias definition** or a history link. Earlier assignments can precede an unbind/reset. A reassignment marker is informational: replacements can be intentional.
- **Focus your search:** category and state filters dim the physical layout. The category menu uses matching color dots in its selected value and options. Arrow keys, Home/End and initial letters move through options; Enter/Space selects, Escape cancels and Tab continues to the next control. Expand **Literal binds** to browse keycaps paired with catalog explanations and secondary literal commands, including names outside the reference layout. Literal names retain their original case and remain independent.
- **Read the analysis:** ! marks reassignment/ambiguity; ? and a dashed border mark uncertainty. Expand **Analysis details** for unresolved effects such as external execs, unsupported actions and syntax/budget limits. These results describe a single-file static model, not verified game behavior.

The panel is read-only. Tab moves through controls; Enter or Space selects an input. Selecting moves focus to the inspector. Updates preserve focus by stable input/literal identity, and switching sources clears selection. Dark, light and high-contrast themes use VS Code colors. The keyboard stays 1080 pixels wide: scroll its region horizontally or Tab to an offscreen key to reveal it. The page itself fits the panel. Below 1200 pixels the inspector sits below the canvas; below 900 pixels filters collapse and the canvas takes the full width. The header identifies the source with a CFG badge and its path in monospace. Analysis scope explanations stay in the collapsed details.

Closing the source clears the result. Oversized files pause analysis. If analysis fails, **Retry** requests a fresh snapshot; technical errors go to the Extension Host log. Navigation from stale snapshots is rejected. The map does not expand external CFGs, execute bind bodies or write bindings.
