# User guide

Settings and detailed behavior for CS2 Config Tools. For a feature overview, see the [README](../README.md).

[Guia em portugu?s](user-guide.pt-BR.md)

## Start using it

Install the `.vsix` from `artifacts/` using **Extensions → … → Install from VSIX**. Open a CS2 CFG; for custom locations, select **CS2 CFG** in the language selector. The extension offers command suggestions, hover documentation, local alias definitions and links to files referenced by `exec`.

CFGs under `game/csgo/cfg` and Steam profiles under `730/local/cfg` automatically use **CS2 CFG**, including subfolders. Explicit `files.associations` take precedence. Other CFG locations can use the Hub or the language selector; `.vcfg` files are not associated.

Type `cl_cross` for crosshair commands, `bind "` for known keys, or `bind "x" "` for actions. Suggestions inside strings are enabled by default for CS2 CFG; your editor settings can override this. Use **Ctrl+Space** if automatic suggestions are disabled.

The normal completion policy still applies: snapshot-hidden names such as `cl_crosshairalpha` require `cs2Config.completionMode: "advanced"`. A suggestion is not verification of game behavior.

CFG is used by many applications, so associate files explicitly only in a custom CS2 workspace:

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

**Connect configuration** on Home or Workspace discovers the game CFG folder and Steam userdata in one flow. When one folder/profile is found it is proposed automatically; multiple results require a selection. Review both paths in one consent dialog before content is read. This is a local folder connection, without Steam credentials. Manual folder selection remains available; if userdata is missing, select **Continue with CFGs only**. Canceling selection or consent changes neither connection. Existing folder permissions persist. Each source keeps its own status and can be recovered independently if unavailable.

Each CFG row offers **Remove CFG**. Review the exact path and confirm **Move to Trash**; only that CFG is removed. Unsaved buffers must be saved or discarded first. Removal requires a trusted workspace and rechecks the folder, selected file and identity after confirmation; changed targets are refused. There is no permanent-delete fallback if Trash is unavailable. Other CFGs and their exec references are preserved.

The Bind Map keeps a category-colored circle on assigned keys even when their state is uncertain. Dashed borders and accessible descriptions still indicate uncertainty; an additional exclamation mark identifies reassignment/ambiguity. Category and State controls align side by side at narrow widths.

## Config hub

Click **CS2 Config Tools** in the Activity Bar and choose **Home**, or run **CS2 Config: Open Home**. Use **Connect configuration** to search common Steam locations, libraries declared by Steam and local profiles in one flow, including other drives. **Choose folder** always allows manual selection.

Before listing CFGs, the extension asks you to allow the selected directory. A custom folder outside `game/csgo/cfg` is supported and labeled accordingly. The canonical folder is remembered locally for the next session; **Disconnect** removes that choice. Connected means the directory is accessible, not that CS2 is running or its build was verified.

The sidebar lists CFG files and the Home offers file opening, the read-only **Visual Bind Map** and **Health Check**. Files opened through the hub use CS2 CFG language mode. Analysis includes unsaved text from open editors and refreshes after edits or file changes. **Refresh** retries an unavailable folder. **Open in Explorer** reveals the connected directory.

**New CFG** creates an empty file after you review its name and destination. Existing files are never overwritten, even if another process creates the same name during the dialog. Creation requires a trusted workspace. Edit existing configurations in VS Code's text editor; the hub does not execute commands or save your edits automatically.

Overview counts exclude the collapsed group of game-like names and are sums of independent single-file analyses, not a merged configuration or the running game's state. Each row distinguishes a partial result from the modeled subset. No “Valid” certification is shown. Only the first 100 regular CFG files directly in the folder are listed; nested directories and symbolic links are excluded. Files exceeding the existing analysis limit or inaccessible files have no summary and are excluded from analyzed totals. The hub's selected directory does not change the `cs2Config.cfgRoot` setting used by exec links.

The Home menu contains only implemented tools: Autoexec Builder, Visual Bind Map, CFG Health Check and New empty CFG. File-specific shortcuts use autoexec.cfg when present, otherwise the first visible non-game CFG; file rows open tools for that exact file. Empty folders still allow file creation. Autoexec Builder is available without a connected folder; choose a destination explicitly. See [feature status](../FEATURES.md).

## Command Explorer

Open **Command Explorer** from Home Quick Actions, the Tools sidebar or **CS2 Config: Explore Commands**. Type a command name or an English/pt-BR description in the native search picker; Enter opens its documentation. Exact names appear first. The eye button toggles the normal/full catalog for that search without changing your settings; the initial policy follows cs2Config.completionMode. Search is offline and bounded to relevant results from the shared registry. No results means the current query/policy has no match, not that the game removed a command.

The dedicated page renders the same documentation service as hover, with community summaries, original help, reviewed parameters, examples and provenance kept separate. **Copy command name** copies only the selected registry name. It never executes or inserts a command. Unknown defaults or enum meanings are not invented. **Search commands** returns to the picker. Description language follows the existing extension language setting with English fallback.

## File grouping and saved video settings

Video Settings identifies its read-only scope in the header. Each setting pairs a friendly label with its original key; the adjacent literal value remains visible in narrow panels. **About these values** explains the limits of interpretation. Missing/disconnected files show recovery messages instead of an empty table.

The main list includes familiar player file names (autoexec, practice, binds, aliases, crosshair and radar) and unclassified files. In a typical game/csgo/cfg directory, gamemode__, gamemap__ and server*.cfg names appear in a collapsed group in Home and the sidebar. The labels **Your CFGs** and **Other CS2 CFGs** describe the primary/collapsed groups. This is a name heuristic, not proof of authorship or game management; custom directories do not apply the game-name heuristic. All listed files remain accessible and editable as text. The overview excludes the collapsed group; partial findings still describe only each file.

**Saved Game Settings** offers connection and manual recovery directly. The sidebar entry opens video with the same connection actions. Use **Connect configuration** to discover both sources and approve both paths together. Detection enumerates numeric profiles with a 730/local/cfg directory in the discovered Steam roots; it does not infer identity. A sole candidate is proposed for your approval, while multiple profiles require selection. Under **Configuration Sources**, manual folder selection remains available for independent recovery. Sources are remembered locally. **Disconnect Game Settings** clears only this connection. **Refresh** retries both sources.

**Game Settings → Video Settings** opens a dedicated read-only page. It reads only cs2_video.txt, including any unsaved buffer, and updates after file/editor changes. Resolution and reduced aspect ratio are calculated from positive integer dimensions; frequency is numerator divided by a positive denominator. No monitor capabilities, GPU brand, defaults or game enum meanings are inferred. The page remains an inspection view. **Open in editor** opens the authorized video file for manual text editing and normal VS Code save/undo; it does not modify or save values on your behalf and creates no automatic backup. Enum validation, presets, safe visual writing and backup/diff flows are still planned. Known labels identify raw keys; unknown keys and values remain visible. Definitions retain source/confidence metadata in the shared core, and none are editable.

**View raw settings** displays the original text in a read-only Output channel. Inspection never writes userdata or executes CFGs. Missing files, inaccessible folders and incomplete/unsupported text have distinct recovery states. The bounded parser supports a single quoted KeyValues root with flat quoted key/value pairs, whitespace, BOM and // comments. Nested structures, escape sequences, duplicate keys (case-insensitive), unfinished strings and files over 256,000 bytes are unsupported; derived values are omitted for malformed/conflicting input. Raw inspection remains available for parsed but unsupported text. Folder and file identity checks exclude symlink video files and reads outside the authorized directory.

The Home shows **Controls** only as a saved controls file detected by its regular filename; **Open** opens that file as text, without modeling its binds. Crosshair and radar rows link to CFGs containing direct statements in those groups; this does not claim saved/current game values. Missing categories say not detected.

The **CFG Overview** counts CFGs only, never video. Findings separate errors, warnings and informational notes. **Checked**, **Needs review** and **Partial analysis** describe analysis coverage rather than game validity. Header status identifies the connected source when only one exists. Sources collapse when both are connected and video is accessible; setup or unavailable/malformed/missing video expands them, preserving manual disclosure toggles during routine updates. Disconnect buttons appear only for selected sources; connected userdata offers Open folder, Change connection and Disconnect. **Analysis scope** and Folder access are collapsed disclosures.

Controls, crosshair/radar userdata models, video editing, backups and applying changes remain planned. No game-build/runtime verification is implied.

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

Run **CS2 Config: Check CFG Health** from the Command Palette while a CS2 CFG is active. The Output panel separates Summary, Findings, Unresolved effects and Scope/next steps. Findings are grouped by syntax, values, selected console evidence, compatibility, unknown names and repeated/replaced binds, with error/warning/information totals and source line numbers. Previous bindings and alias definitions retain their source lines. Explanations are shared with editor diagnostics; the report language follows `cs2Config.descriptionLanguage`. Copy the plain text from Output to share it. “Needs review” refers only to the selected console report and its stated build scope; it is not a universal removal claim. A partial result with no findings can still have unresolved effects. This is single-file static analysis: `exec`, dynamic commands, cycles and budgets produce partial results. The report does not execute CFGs, score game performance or describe the current game state. Its checks are a full report, independent of whether individual editor warnings are hidden.

The shared effective model retains ordered assignment/bind history, handles `unbind`/`unbindall` and expands resolvable local aliases with limits. Assignments inside a bind or alias declaration are deferred. Workspace execution and context/cheats validation are still planned.

Repeated binds receive informational notices: identical action text is a repetition, different text replaces the preceding binding. Each notice links to the prior binding; changes made by a local alias point to the call and its definition. Set `cs2Config.bindDiagnostics` to `off`, `information` (default) or `warning`. The health report includes replacement/repetition counts even when editor notices are off.

Comparisons stop at unresolved effects and restart after explicit writes. `unbind` and `unbindall` reset the affected binding history used for comparison; deferred keypress bodies are not executed. Key names and action text are compared literally. A replacement can be intentional, and no automatic deletion or cleanup is offered.

## Visual bind map

The mouse has mirrored primary buttons, a centered wheel/M3 and separate embedded M4/M5 regions. Device regions and adjacent controls share selection, uncertainty and category states; wheel directions remain separate controls. The keyboard preserves its readable scale through local scrolling.

With a CS2 CFG active, click the keyboard icon in the editor title bar, or run **CS2 Config: Open Bind Map**. Select the **CS2 CFG** language first if the file opened as plain text. The panel follows that file, including unsaved changes; activate another CFG and run the command again to switch sources.

- **Explore your inputs:** select any key on the proportional ANSI keyboard, its numpad or the mouse. The mouse includes five buttons and both scroll directions. Inputs missing from this analysis show "No binding found"; they may still have bindings in the game.
- **Understand a bind:** the inspector puts the available catalog explanation before the literal action, then shows its category and source line. Expand **Raw bind** for the original statement. **Binding history** appears only when there are multiple assignments. Descriptions follow cs2Config.descriptionLanguage, with English fallback. Aliases and sequences that cannot be safely classified appear as custom; slot names retain generic explanations when a specific item mapping is undocumented.
- **Find the source:** use **Open source**, **Open alias definition** or a history link. Earlier assignments can precede an unbind/reset. A reassignment marker is informational: replacements can be intentional.
- **Focus your search:** category and state filters dim the physical layout. The category menu uses matching color dots in its selected value and options. Arrow keys, Home/End and initial letters move through options; Enter/Space selects, Escape cancels and Tab continues to the next control. Expand **Literal binds** to browse keycaps paired with catalog explanations and secondary literal commands, including names outside the reference layout. Literal names retain their original case and remain independent.
- **Read the analysis:** ! marks reassignment/ambiguity; a dashed border and accessible description mark uncertainty. Category circles remain visible. Expand **Analysis details** for unresolved effects such as external execs, unsupported actions and syntax/budget limits. These results describe a single-file static model, not verified game behavior.

The panel is read-only. Tab moves through controls; Enter or Space selects an input. Selecting moves focus to the inspector. Updates preserve focus by stable input/literal identity, and switching sources clears selection. Dark, light and high-contrast themes use VS Code colors. The keyboard stays 1080 pixels wide: scroll its region horizontally or Tab to an offscreen key to reveal it. The page itself fits the panel. The inspector spans the page below both devices at every width. Dedicated Keyboard and Mouse sections sit side by side when the canvas can fit the full keyboard and mouse; otherwise they stack. The mouse shows M1–M5 inside its body, with seven adjacent controls for those buttons and both scroll directions. Controls show catalog explanations when available and share selection, category and state with the drawing. Below 900 pixels filters collapse and the canvas takes the full width. The header identifies the source with a CFG badge and filename; its tooltip retains the full path. Analysis scope explanations stay in the collapsed details.

Closing the source clears the result. Oversized files pause analysis. If analysis fails, **Retry** requests a fresh snapshot; technical errors go to the Extension Host log. Navigation from stale snapshots is rejected. The map does not expand external CFGs, execute bind bodies or write bindings.

Scoreboard and mouse-axis binds (`bind "TAB" "+showscores"`, `bind "MOUSE_X" "yaw"`, `bind "MOUSE_Y" "pitch"`) are recognized with bilingual descriptions and a pinned default-key-file reference. This does not establish a tested game build or execution permissions.

## Autoexec Builder MVP

Open **Autoexec Builder** in Home → Quick Actions or the Tools tree (command **CS2: Autoexec Builder**). Choose an existing CFG or a new destination. A connected folder supplies an autoexec.cfg suggestion. If the chosen file exists, edit it or choose another name; there is no replacement flow. Choosing/cancelling a destination never creates a file.

1. Choose a supported key or mouse control.
2. Search an action by command or human meaning (smoke / slot8, flash, molotov / incendiary, primary).
3. Add the bind to the draft. Known numeric ConVar constraints are validated through the registry. Other parameters use safe single tokens separated by spaces; quoted arguments, escapes, aliases and command sequences are outside this MVP.
4. Select **Review changes**. The human diff shows the previous/new meaning; expand **Raw CFG diff** or open the full editor diff to inspect the exact source.
5. If a key already has a bind, review its current action and explicitly select **Replace existing**, then review again. Duplicate draft keys block apply.
6. Review uncertainty/context notes and acknowledge them before **Apply to editor**. Cancel preview or close the builder to leave the destination unchanged.

Existing CFG edits remain in the editor buffer with normal Undo; save when ready. New files are created exclusively through a workspace edit, with generated text opened in the editor. The builder checks buffer version/text and disk text against the preview; any intervening change invalidates apply and requires a new review. It preserves comments, unrelated text, existing quotes, CRLF/LF and final-newline presence. A bind written through an alias is overridden by an appended explicit bind; the alias body is never rewritten.

Slot meanings are shared with Bind Map, hover and completion. slot1–slot10 have human labels (including **Knife / Melee**, **Cycle Grenades**, **C4 / Bomb** and **Molotov / Incendiary**). slot11 has a community Zeus x27 mapping; slot12 is mode-dependent Healthshot; slot13 retains its technical name with a tentative utility-items note. These are community explanations, not Valve-authored help or game-build verification. Items may be unavailable. Single-file analysis cannot resolve external execs or dynamic effects; the preview exposes that uncertainty. No CFG is executed.

## Safety and analysis limits

Changing the Autoexec Builder destination, cancelling, or closing its panel invalidates the reviewed preview. Review again after buffer/disk changes. Supported destinations are regular UTF-8 files up to four million bytes and one million characters; oversized unsaved buffers are rejected before copying their text. Invalid encoding, inaccessible or changing files produce an explicit error. Existing edits preserve unrelated text, quotes, comments, line endings and final newline and remain undoable in the editor.

Immediate aliases are interpreted in written execution order. A later alias definition does not suppress an earlier value warning; invoked aliases can create later aliases. Bind bodies remain deferred. Cycle warnings appear in both editor diagnostics and Health; unresolved effects still make analysis partial. Reviewed inventory-slot labels describe only recognized literal actions: `slot8 unexpected` keeps its raw action without a confident whole-action label.

At narrow Hub widths, scroll the file table locally to reach actions while filenames remain on one line. Exec navigation checks bounded batches and stops scheduling on cancellation. It rejects absolute/traversal names but may follow filesystem links; it does not execute or include target CFGs in effective analysis. Opening saved controls selects the first matching file as a shortcut, not the effective game controls slot.

If the command catalog cannot load, analysis is unavailable and the extension asks you to reinstall, or rebuild a development checkout. It never substitutes an empty catalog.
