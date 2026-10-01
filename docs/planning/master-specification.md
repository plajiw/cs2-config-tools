You are acting as a senior software engineer, language tooling engineer, VS Code extension engineer, static analysis engineer, and software architect.

You are working on an existing project named:

CS2 Config Tools

The project is a Visual Studio Code extension focused on Counter-Strike 2 configuration files (.cfg).

This is NOT merely a syntax-highlighting extension.

The long-term goal is to make CS2 Config Tools the most complete developer-style tooling environment for creating, understanding, validating, maintaining, migrating, and visually editing Counter-Strike 2 configuration files.

The extension should combine:

- language support;
- command documentation;
- command provenance;
- autocomplete;
- diagnostics;
- linting;
- formatting;
- static analysis;
- configuration health analysis;
- visual bind editing;
- visual autoexec generation;
- practice config generation;
- crosshair/radar builders;
- config migration;
- update compatibility checking;
- semantic config comparison;
- config dependency analysis;
- command exploration;
- future extensibility.

============================================================
0. CORE ENGINEERING PRINCIPLES
============================================================

Before changing anything:

1. Inspect the existing repository thoroughly.
2. Understand the current architecture.
3. Identify:
   - existing parser;
   - providers;
   - diagnostics;
   - command datasets;
   - tests;
   - fixtures;
   - VS Code contribution points;
   - WebViews;
   - scripts;
   - build pipeline;
   - package structure.
4. Do not rewrite working subsystems without justification.
5. Prefer incremental refactoring.
6. Preserve public behavior unless a change is explicitly required.
7. Do not introduce unnecessary dependencies.
8. Keep domain logic independent from VS Code whenever possible.
9. UI layers must consume domain services rather than duplicate business rules.
10. Never hardcode hundreds of CS2 commands directly into providers.

The architecture must prioritize:

- correctness;
- provenance;
- maintainability;
- testability;
- extensibility;
- performance;
- user trust.

Do not create fake certainty.

If command behavior is unknown, represent that uncertainty explicitly.

Do not invent:
- command descriptions;
- defaults;
- valid ranges;
- aliases;
- replacements;
- deprecated status;
- runtime behavior.

Every factual claim about a CS2 command should ideally have provenance.

============================================================
1. PRODUCT VISION
============================================================

CS2 Config Tools should eventually feel like a miniature IDE specifically for Counter-Strike 2 CFG files.

A user opening:

autoexec.cfg

should immediately receive:

- syntax highlighting;
- autocomplete;
- hover documentation;
- semantic descriptions;
- validation;
- typo detection;
- quick fixes;
- obsolete command warnings;
- command lifecycle information;
- bind conflict detection;
- alias resolution;
- exec-file resolution;
- effective-value analysis;
- inlay hints;
- navigation;
- formatting;
- documentation browsing.

A non-technical user should also be able to open:

CS2 Config Tools: Create Autoexec

and visually build a configuration without knowing console commands.

The same domain engine must power BOTH:

1. textual editing;
2. visual editing.

There must NOT be separate rule systems for the text editor and visual generator.

============================================================
2. HIGH-LEVEL ARCHITECTURE
============================================================

Use a modular architecture approximately like:

src/
├── extension/
│   ├── extension.ts
│   ├── commands.ts
│   └── activation.ts
│
├── language/
│   ├── lexer/
│   ├── parser/
│   ├── ast/
│   ├── cst/
│   ├── serializer/
│   └── semantics/
│
├── analysis/
│   ├── diagnostics/
│   ├── bindings/
│   ├── aliases/
│   ├── exec/
│   ├── effective-state/
│   ├── dependency-graph/
│   ├── health/
│   └── migration/
│
├── providers/
│   ├── completion/
│   ├── hover/
│   ├── formatting/
│   ├── code-actions/
│   ├── definitions/
│   ├── references/
│   ├── symbols/
│   ├── inlay-hints/
│   ├── code-lens/
│   └── colors/
│
├── domain/
│   ├── commands/
│   ├── convars/
│   ├── binds/
│   ├── config/
│   ├── metadata/
│   ├── provenance/
│   └── lifecycle/
│
├── database/
│   ├── generated/
│   ├── curated/
│   ├── schemas/
│   ├── loaders/
│   └── registry/
│
├── importers/
│   ├── source2/
│   ├── gametracking/
│   ├── valve/
│   └── community/
│
├── webviews/
│   ├── autoexec-builder/
│   ├── command-explorer/
│   ├── health-report/
│   ├── config-diff/
│   └── documentation/
│
├── generators/
│   ├── autoexec/
│   ├── practice/
│   └── templates/
│
├── services/
│   ├── command-registry/
│   ├── documentation/
│   ├── config-workspace/
│   ├── snapshots/
│   └── versioning/
│
└── shared/
    ├── types/
    ├── utilities/
    └── constants/

Tests should mirror the architecture.

Do not blindly create these folders if equivalent structures already exist.

Refactor gradually toward this separation.

============================================================
3. LANGUAGE ENGINE
============================================================

Treat CS2 CFG as a small scripting/configuration language.

The parser must eventually understand:

- command invocation;
- ConVar assignment;
- quoted strings;
- numeric values;
- booleans represented as 0/1 or true/false where accepted;
- comments;
- blank lines;
- semicolon-separated commands;
- bind;
- unbind;
- unbindall;
- alias;
- exec;
- toggle;
- incrementvar if supported;
- nested command strings inside bind;
- nested command strings inside alias.

Examples:

fps_max "400"

bind "x" "slot8"

bind "kp_2" "buy m4a1; buy ak47"

alias "bots_freeze" "bot_stop 1; bot_dont_shoot 1"

exec practice

The parser should produce semantic structures rather than relying on regex-only validation.

Regex may be used for lexical support, but not as the sole language architecture.

============================================================
4. AST VS CST
============================================================

Support an AST for semantic analysis.

Also preserve enough source information to eventually support CST-like editing.

The system should retain:

- comments;
- whitespace;
- original ranges;
- quotes;
- ordering;
- blank lines.

This is important because visual editing of an existing autoexec should eventually modify only the required parts rather than rewriting the whole file.

Example:

// My communication binds

bind "p" "messagemode"

If visual editor changes P to team chat:

bind "p" "messagemode2"

the original comment should remain.

Do not make full round-trip CST support mandatory for the first version if it is not currently feasible.

Design the architecture so it can be added later.

============================================================
5. COMMAND DATABASE
============================================================

Do NOT maintain a giant manually written commands.json as the main source of truth.

Separate generated metadata from curated knowledge.

Suggested structure:

data/
├── generated/
│   ├── commands.json
│   ├── convars.json
│   ├── official-usage.json
│   └── builds.json
│
└── curated/
    ├── descriptions.json
    ├── categories.json
    ├── legacy.json
    ├── replacements.json
    ├── examples.json
    ├── aliases.json
    └── notes.json

Generated data must be reproducible.

Curated data must never be overwritten by import jobs.

============================================================
6. DATA SOURCES AND TRUST MODEL
============================================================

Use a hierarchy of evidence.

Highest-confidence technical source:

1. Current CS2 / Source 2 data and dumps.
2. GameTracking-CS2 or equivalent tracking of actual game files.
3. Official Valve documentation.
4. Official CS2 configuration files distributed with the game.
5. High-quality community documentation.
6. Curated project knowledge.

The game data should answer questions like:

- does this symbol currently exist?
- command or ConVar?
- flags?
- default?
- min/max?
- help string?
- server/client metadata?
- hidden/development/cheat/etc?

Community documentation may improve descriptions, but must NOT override verified game metadata without explicit justification.

============================================================
7. PROVENANCE MODEL
============================================================

Every metadata field should be able to carry provenance.

Example concept:

interface Evidence<T> {
    value: T;
    source: SourceReference;
    confidence: Confidence;
}

interface SourceReference {
    type:
        | "source2-dump"
        | "game-file"
        | "valve-docs"
        | "community"
        | "curated";
    location?: string;
    build?: string;
    retrievedAt?: string;
}

type Confidence =
    | "verified"
    | "high"
    | "community"
    | "unknown";

Do not force every runtime object to literally use Evidence<T> if that becomes cumbersome.

But the underlying database architecture must preserve provenance.

============================================================
8. COMMAND LIFECYCLE
============================================================

Do NOT conflate:

- hidden;
- development-only;
- cheat;
- deprecated;
- legacy;
- removed;
- unknown.

Use distinct concepts.

Example:

type CommandLifecycle =
    | "active"
    | "deprecated"
    | "legacy"
    | "removed"
    | "unknown";

interface CommandAvailability {
    hidden?: boolean;
    cheatProtected?: boolean;
    developmentOnly?: boolean;
    client?: boolean;
    server?: boolean;
    replicated?: boolean;
    archived?: boolean;
}

"hidden" does NOT mean deprecated.

"not found in current dump" does NOT automatically mean removed.

A command should only become confidently "removed" when historical evidence supports that conclusion.

Potential lifecycle pipeline:

present in previous verified build
+
absent in current build
=
candidate removed

after additional evidence/history:
=
removed

Unknown typos must not be labeled removed.

============================================================
9. NORMALIZED COMMAND MODEL
============================================================

Aim for something similar to:

interface Cs2Symbol {
    name: string;

    kind:
        | "command"
        | "convar";

    category?: string;

    valueType?:
        | "boolean"
        | "integer"
        | "float"
        | "string"
        | "enum";

    defaultValue?: unknown;

    range?: {
        min?: number;
        max?: number;
    };

    enumValues?: Array<{
        value: string | number;
        label: string;
        description?: string;
    }>;

    description?: string;

    lifecycle: CommandLifecycle;

    availability: CommandAvailability;

    replacement?: string;

    requirements?: string[];

    notes?: string[];

    examples?: CommandExample[];

    firstSeenBuild?: string;
    lastSeenBuild?: string;
    lastVerifiedBuild?: string;

    sources: SourceReference[];
}

============================================================
10. COMMAND CATEGORIZATION
============================================================

Provide meaningful categories.

Examples:

- Crosshair
- Radar
- HUD
- Mouse
- Movement
- Audio
- Network
- Matchmaking
- Gameplay
- Viewmodel
- Practice
- Bots
- Grenades
- Rendering
- Buy
- Communication
- Demo
- Server
- Developer

Prefix inference may help:

cl_
sv_
mp_
bot_
r_
snd_
viewmodel_
cl_crosshair*
cl_radar*

But category must not be based purely on prefix if better metadata is available.

============================================================
11. CURRENT HOVER UX MUST BE IMPROVED
============================================================

The current extension may display text similar to:

"Community documentation. Build and runtime behavior not yet verified."

or:

"Observed corpus examples, not guaranteed valid."

or:

"Rejected in the selected console report..."

This is internal/pipeline language and should NOT be exposed directly to normal users.

Translate evidence into useful product language.

The hover should answer:

1. What does this do?
2. What type is it?
3. What is the current assigned value?
4. What is the default?
5. What values are valid?
6. Is it currently active?
7. Client/server/local?
8. Does it require sv_cheats?
9. Is it archived/persistent?
10. Is it legacy or removed?
11. Where does this information come from?

============================================================
12. HOVER DESIGN
============================================================

Example:

### cl_teamid_overhead_maxdist

Maximum distance at which teammate identifiers can be displayed above players.

**Current:** `6000`
**Default:** `6000`
**Type:** `float`
**Status:** Active
**Category:** HUD
**Scope:** Client
**Flags:** archive

---

`cl_teamid_overhead_maxdist "6000"`

---

Source: CS2 Source 2 metadata
Last verified: Build XXXXX

If a detail is uncertain:

Documentation note:

The command exists in the current CS2 build, but Valve does not document the exact distance unit.

Do not say generically:

"runtime behavior unverified"

unless that distinction is actually relevant.

============================================================
13. HOVER SHOULD BE SEMANTIC
============================================================

Boolean example:

cl_radar_rotate "1"

should show:

Current
Enabled

Raw value
1

not only:

integer: 1

Enum example:

cl_crosshairstyle "4"

should show:

Current
4 — Static Cross

Possible values:
0 — ...
1 — ...
4 — Static Cross
...

Do not force users to interpret integer enums manually.

============================================================
14. EXAMPLES MUST BE USEFUL
============================================================

Do not show the current line and call it an "example".

Bad:

Example:
cl_teamid_overhead_maxdist "6000"

when the user is already hovering:

cl_teamid_overhead_maxdist "6000"

Instead distinguish:

Current assignment

from:

Examples

Only provide examples when they teach something.

Do not invent example behavior if not verified.

============================================================
15. DIAGNOSTICS
============================================================

Use proper severity.

ERROR:
- invalid syntax;
- unterminated string;
- invalid value type;
- clearly unknown command where alias resolution fails;
- missing required exec target;
- malformed bind.

WARNING:
- removed command;
- strongly verified legacy command;
- out-of-range value;
- duplicate bind;
- command rejected in current verified build.

INFORMATION:
- command requires sv_cheats;
- server-only command;
- development-only command;
- context-specific command.

HINT:
- current assignment equals default;
- value overwritten later;
- unused alias;
- redundant config entry.

Do not flood the Problems panel.

53 warnings for minor uncertainty is bad UX.

============================================================
16. USER-CONFIGURABLE DIAGNOSTICS
============================================================

Expose settings such as:

cs2ConfigTools.diagnostics.legacy
cs2ConfigTools.diagnostics.removed
cs2ConfigTools.diagnostics.defaultValues
cs2ConfigTools.diagnostics.cheatCommands
cs2ConfigTools.diagnostics.duplicateBinds
cs2ConfigTools.diagnostics.unknownCommands

Possible settings:

error
warning
information
hint
off

Use sensible defaults.

============================================================
17. QUICK FIXES
============================================================

Support Code Actions where appropriate.

Unknown typo:

cl_crosshair_lenght

→

Did you mean:
cl_crosshair_length

Quick Fix:
Replace with cl_crosshair_length

Legacy:

Quick Fix:
Remove legacy command

or:
Replace with supported command

Only offer automatic replacement when conversion is semantically safe.

Do NOT silently convert commands where units or behavior changed.

============================================================
18. FUZZY MATCHING
============================================================

Implement typo suggestions using a lightweight and deterministic strategy.

Examples:

Levenshtein distance
prefix matching
weighted similarity

Unknown:

cl_crosshair_lenght

suggest:

cl_crosshair_length

Prioritize commands that:
- share prefix;
- belong to same category;
- differ minimally.

============================================================
19. BIND ANALYSIS
============================================================

Understand:

bind
unbind
unbindall

Track final effective state.

Example:

bind "F1" "bot_place"
...
bind "F1" "buy awp"

The first binding should produce:

Hint:
This binding is overwritten later at line X.

Effective binding:
F1 → buy awp

Provide:

- duplicate/rebound detection;
- current effective bind;
- previous bindings;
- source location.

============================================================
20. SEMANTIC BIND DOCUMENTATION
============================================================

Understand common actions.

Example:

bind "x" "slot8"

Hover on X:

X

Bound action:
Smoke Grenade

Raw command:
slot8

Category:
Grenade

For:

bind "kp_2" "buy m4a1; buy ak47"

show:

NUMPAD 2

Buy bind

CT:
M4A1-S / M4A4

T:
AK-47

Commands:
buy m4a1
buy ak47

Use data-driven action metadata.

Do not hardcode UI-only special cases everywhere.

============================================================
21. ALIAS ANALYSIS
============================================================

Support:

alias "bots_freeze" "bot_stop 1; bot_dont_shoot 1"

Features:

- definition;
- go to definition;
- references;
- hover;
- unused alias diagnostic;
- alias expansion;
- bind → alias resolution.

Example:

bind "F4" "bots_freeze"

Ctrl+Click on bots_freeze:

go to alias declaration.

============================================================
22. EXEC RESOLUTION
============================================================

Support:

exec practice

Resolve:

practice.cfg

Features:

- Go to Definition;
- missing file diagnostic;
- suggestions;
- dependency analysis.

Example:

exec practce

Diagnostic:

Cannot resolve CFG file "practce".

Did you mean:
practice.cfg

============================================================
23. DEPENDENCY GRAPH
============================================================

Understand relationships like:

autoexec.cfg
├── binds.cfg
├── crosshair.cfg
└── practice.cfg

Detect cycles:

autoexec.cfg
→ binds.cfg
→ autoexec.cfg

Diagnostic:

Circular exec dependency.

Expose command:

CS2 Config Tools: Show Config Dependency Graph

Initial implementation may be textual/tree-based.

A richer WebView can come later.

============================================================
24. EFFECTIVE CONFIG STATE
============================================================

Analyze assignment order.

Example:

sensitivity "1.4"

...

sensitivity "1.2"

...

exec mouse

mouse.cfg:
sensitivity "1.0"

Hover or analysis should show:

Effective value:
1.0

Assignments:
autoexec.cfg:12 → 1.4
autoexec.cfg:97 → 1.2
mouse.cfg:4 → 1.0

Final assignment wins.

This should also work for binds.

============================================================
25. INLAY HINTS
============================================================

Provide optional inlay hints.

Examples:

cl_radar_rotate "1"          Enabled

cl_crosshairstyle "4"        Static Cross

bind "x" "slot8"             Smoke Grenade

bind "p" "messagemode"       Global Chat

Make configurable.

Examples:

cs2ConfigTools.inlayHints.enabled
cs2ConfigTools.inlayHints.enums
cs2ConfigTools.inlayHints.bindActions
cs2ConfigTools.inlayHints.booleans

============================================================
26. COLOR DECORATORS
============================================================

For crosshair RGB values, consider integrating VS Code color decorations.

Example:

cl_crosshaircolor_r
cl_crosshaircolor_g
cl_crosshaircolor_b
cl_crosshaircolor_a

When the complete color can be resolved, show a color decorator.

Potential future enhancement:
VS Code color picker integration.

Do not prioritize this over core language correctness.

============================================================
27. FORMATTING
============================================================

The formatter should be conservative.

It may:

- normalize whitespace;
- normalize spacing between arguments;
- remove unnecessary trailing semicolons;
- optionally normalize key casing;
- preserve comments;
- preserve logical sections;
- preserve blank lines reasonably.

It MUST NOT change semantics.

Never automatically turn:

fps_max "999"

into:

fps_max "0"

That belongs to diagnostics/code actions, not formatting.

============================================================
28. CONFIG HEALTH CHECK
============================================================

Implement:

CS2 Config Tools: Inspect Current Config

Example output:

Config analysis

124 commands parsed

✓ 109 active
⚠ 7 legacy
⚠ 2 duplicate binds
ⓘ 4 default-value assignments
✕ 1 unknown

Duplicate binds:
F1
MOUSE4

Legacy:
...

Unknown:
cl_crosshair_lenght

Did you mean:
cl_crosshair_length

This can initially use VS Code Output/QuickPick.

Later add a WebView report.

============================================================
29. CONFIG CLEANER
============================================================

Implement:

CS2 Config Tools: Clean Config

Analyze possible cleanup:

31 lines can potentially be removed

12 values equal current defaults
7 duplicate assignments
5 overwritten binds
3 obsolete commands
4 unused aliases

Never automatically delete everything.

Generate a review.

Provide Code Actions or preview.

============================================================
30. COMMAND EXPLORER
============================================================

Implement:

CS2 Config Tools: Browse Commands

Create a searchable command explorer.

Filters:

- All
- Active
- Legacy
- Removed
- Cheat
- Archived
- Hidden
- Development
- Client
- Server
- category

Search examples:

crosshair
radar
bot
grenade

Each command page should show:

- description;
- type;
- default;
- range;
- enum;
- flags;
- lifecycle;
- category;
- requirements;
- examples;
- source;
- build metadata.

The command explorer should consume the SAME registry used by IntelliSense and hover.

============================================================
31. FULL DOCUMENTATION VIEW
============================================================

Hover should remain concise.

Provide:

Open Full Documentation

which opens a larger documentation panel.

Do not put every available field into hover.

Use:

Hover → quick understanding
Documentation Panel → detailed research

============================================================
32. CONFIG UPDATE COMPATIBILITY
============================================================

Long-term feature:

When command database changes between CS2 builds:

Build A → Build B

determine whether user's config is affected.

Example:

This CS2 update affects your configuration.

2 commands removed
3 commands changed
1 default changed

Affected:
cl_crosshairsize
cl_crosshairthickness

Not relevant:
142 other changed symbols

The goal is personalized compatibility information, not generic patch notes.

============================================================
33. CONFIG MIGRATION
============================================================

Implement migration infrastructure.

Examples:

old symbol → new symbol

But ONLY automate when semantically safe.

If:

old command and new command use different units/scales

show:

Manual adjustment required.

Do not guess equivalent values.

Migration should be represented as structured metadata:

interface MigrationRule {
    from: string;
    to?: string;
    type:
        | "rename"
        | "replacement"
        | "manual"
        | "removed";
    safeAutomaticFix: boolean;
    note?: string;
}

============================================================
34. VISUAL AUTOEXEC BUILDER
============================================================

Implement a WebView:

CS2 Config Tools: Create Autoexec

This is a major product feature.

The UI must be simple, modern, native-looking, responsive, and consistent with VS Code.

Do not make it look like a generic AI-generated dashboard.

Avoid:
- excessive cards;
- excessive gradients;
- emojis;
- decorative clutter;
- giant headers;
- unnecessary animations.

Use VS Code theme variables.

============================================================
35. AUTOEXEC BUILDER LAYOUT
============================================================

Suggested layout:

Left:
navigation/sidebar

Center:
visual editor

Right:
generated CFG preview

Sections:

- Start / Template
- Keyboard
- Mouse
- Buy Binds
- Gameplay
- Crosshair
- Radar
- Audio
- HUD
- Performance
- Advanced
- Review

The generated CFG preview should update in real time.

============================================================
36. VISUAL KEYBOARD
============================================================

Create a full keyboard visualization.

Include:

- ESC
- function keys
- number row
- QWERTY
- modifiers
- navigation keys
- arrows
- numpad

Example visual structure:

[ESC] [F1] [F2] ... [F12]

[`] [1] [2] ...
[TAB] [Q] [W] [E] ...
[CAPS] [A] [S] [D] ...
[SHIFT] [Z] [X] [C] ...

[NUMPAD]

Clicking a key should open assignment UI.

Example:

Key:
P

Assign action:

Communication
- Global Chat
- Team Chat
- Voice Chat
- Player Ping

Weapons
- Primary
- Secondary
- Knife
- C4

Grenades
- Flash
- Smoke
- HE
- Molotov
- Decoy

Interface
- Scoreboard
- Buy Menu
- Console

Movement
...

Custom
- Custom command

Choosing:

Global Chat

generates:

bind "p" "messagemode"

============================================================
37. VISUAL KEYBOARD STATE
============================================================

Assigned keys should show state.

Examples:

P
Global Chat

X
Smoke

C
Flash

NUM2
AK / M4

Hover:

P
Global Chat
messagemode

Use visual category distinction, but remain accessible.

Do not rely solely on color.

============================================================
38. KEY CONFLICTS
============================================================

The visual builder must detect:

P already assigned.

If another action is selected:

Key conflict

Current:
Global Chat

New:
Buy AWP

Options:

Replace
Cancel

Do not silently overwrite.

============================================================
39. VISUAL MOUSE EDITOR
============================================================

Represent:

MOUSE1
MOUSE2
MOUSE3
MOUSE4
MOUSE5
MWHEELUP
MWHEELDOWN

Allow assignment.

Example:

MOUSE4 → +voicerecord
MOUSE5 → player_ping
MWHEELUP → +jump
MWHEELDOWN → +jump

============================================================
40. BUY BIND BUILDER
============================================================

Create a dedicated Numpad/buy interface.

Example:

┌───────────┬───────────┬───────────┐
│ NUM7      │ NUM8      │ NUM9      │
├───────────┼───────────┼───────────┤
│ NUM4      │ NUM5      │ NUM6      │
├───────────┼───────────┼───────────┤
│ NUM1      │ NUM2      │ NUM3      │
├───────────┴───────────┼───────────┤
│ NUM0                  │ ENTER     │
└───────────────────────┴───────────┘

Click a numpad key.

Allow multiple purchases:

[x] Vest + Helmet
[x] Defuse Kit
[x] Smoke
[ ] Flash

Generated:

bind "kp_7" "buy vesthelm; buy defuser; buy smokegrenade"

Use structured actions internally.

============================================================
41. NEVER GENERATE CFG STRINGS DIRECTLY FROM UI STATE
============================================================

Do not model the WebView as:

string command = ...

Use domain objects.

Example:

interface KeyBind {
    key: Cs2Key;
    actions: BindAction[];
}

interface BindAction {
    command: string;
    arguments?: string[];
}

Example:

{
    key: "kp_2",
    actions: [
        {
            command: "buy",
            arguments: ["m4a1"]
        },
        {
            command: "buy",
            arguments: ["ak47"]
        }
    ]
}

Then:

serializeBind(bind)

produces:

bind "kp_2" "buy m4a1; buy ak47"

Serialization belongs in domain/generator infrastructure.

============================================================
42. AUTOEXEC TEMPLATES
============================================================

Provide templates:

Minimal
Competitive-oriented
Low visual clutter
Practice-friendly
Custom

Avoid misleading names like:

Best FPS
Best Pro Settings
Ultimate Performance

Templates must be transparent.

Users should see what each template enables.

============================================================
43. IMPORT EXISTING AUTOEXEC
============================================================

Support:

CS2 Config Tools: Open in Visual Editor

Given:

bind "p" "messagemode"
bind "x" "slot8"
bind "c" "slot7"

the visual editor should represent:

P → Global Chat
X → Smoke
C → Flash

Initially, read-only visualization is acceptable.

Then evolve to round-trip editing.

============================================================
44. EXISTING CONFIG SAFETY
============================================================

If autoexec.cfg already exists:

never silently overwrite.

Offer:

- Edit existing
- Merge
- Replace
- Generate new file
- Cancel

Before destructive replacement:

offer backup.

Possible:

autoexec.cfg.backup

============================================================
45. CROSSHAIR BUILDER
============================================================

Add a visual Crosshair Builder.

UI:

Crosshair Preview

Style
Length
Thickness
Gap
Color
Outline
Dot
T Shape
Follow Recoil

Generated commands update live.

Use the current command database.

Do not hardcode assumptions about old crosshair commands.

If legacy crosshair commands exist in an imported config, provide migration information.

============================================================
46. RADAR BUILDER
============================================================

UI:

Radar

Zoom
HUD Scale
Rotate
Always Centered
Square With Scoreboard
Icon Scale

Generate current supported radar commands.

Provide descriptions using command metadata.

============================================================
47. PRACTICE CONFIG GENERATOR
============================================================

Implement:

CS2 Config Tools: Create Practice Config

Options:

[x] Infinite ammo
[x] Grenade trajectory
[x] Bullet impacts
[x] Respawn
[x] Noclip
[x] Bot placement
[x] Rethrow grenade
[x] Remove smoke
[x] Long rounds
[x] Buy anywhere

Key bindings:

Noclip             ALT
Place bot          F1
Rethrow grenade    F7
Remove smoke       F8

Generate practice.cfg.

Practice-only commands should be clearly labeled.

Commands requiring sv_cheats should not be presented as ordinary competitive commands.

============================================================
48. VISUAL BIND MAP
============================================================

Implement:

CS2 Config Tools: View Key Bindings

Read the current config and display full keyboard/mouse mapping.

Categories:

Movement
Weapons
Grenades
Communication
Buy
Utility
Custom

Click a key:

show source location and command.

This should work even before full visual editing is implemented.

============================================================
49. CONFIG DIFF
============================================================

Implement semantic compare.

Example:

autoexec.cfg
vs
autoexec-old.cfg

Instead of raw text-only diff:

Mouse
sensitivity
1.40 → 1.20

Crosshair
gap
-3 → -2

Bindings
P
messagemode → messagemode2

Removed
...

Added
...

Use semantic structures.

============================================================
50. CONFIG SNAPSHOTS
============================================================

Future feature:

Save Config Snapshot

Examples:

2026-10-01 Competitive
2026-10-03 New Crosshair
2026-10-09 Mouse Test

Actions:

Restore
Compare
Delete

Do not replace Git for developers.

This feature is for regular users.

============================================================
51. CODELENS
============================================================

Potential CodeLens examples:

Above CROSSHAIR section:

Preview Crosshair
Open Crosshair Editor

Above BINDS:

View Keyboard
Check Conflicts

Above PRACTICE:

Open Practice Builder

Do not overuse CodeLens.

Make configurable.

============================================================
52. CONFIG WORKSPACE VIEW
============================================================

Future explorer view:

CS2 CONFIG

Autoexec
✓ Valid

Binds
⚠ 1 conflict

Crosshair
✓ Valid

Practice
ℹ 12 cheat-only commands

Aim
✓ Valid

Understand a cfg workspace rather than treating every file independently.

============================================================
53. COMMAND PALETTE
============================================================

Eventually expose commands such as:

CS2 Config Tools: Create Autoexec
CS2 Config Tools: Open Autoexec Builder
CS2 Config Tools: View Key Bindings
CS2 Config Tools: Create Practice Config
CS2 Config Tools: Browse Commands
CS2 Config Tools: Inspect Current Config
CS2 Config Tools: Clean Config
CS2 Config Tools: Compare Configs
CS2 Config Tools: Show Config Dependency Graph
CS2 Config Tools: Show Command Documentation
CS2 Config Tools: Migrate Config
CS2 Config Tools: Refresh Command Database

Do not expose unfinished commands.

============================================================
54. WEBVIEW ARCHITECTURE
============================================================

WebView must not contain business logic.

Architecture:

WebView UI
   ↓ messages
VS Code controller
   ↓
Domain services
   ↓
Command Registry / Config Model
   ↓
Generators / Analysis

Message contracts must be typed.

Avoid:

any
unstructured event strings
duplicated command metadata

Use discriminated unions.

Example:

type BuilderMessage =
    | {
        type: "assignBind";
        payload: ...
      }
    | {
        type: "removeBind";
        payload: ...
      }
    | {
        type: "requestPreview";
      };

============================================================
55. SECURITY
============================================================

Follow VS Code WebView security best practices.

Use:

- restrictive Content Security Policy;
- local resource roots;
- nonce for scripts;
- sanitized dynamic content;
- no unsafe eval;
- no arbitrary remote scripts.

Do not render unescaped CFG content into HTML.

============================================================
56. ACCESSIBILITY
============================================================

Visual builder must support:

- keyboard navigation;
- clear focus state;
- labels;
- ARIA where appropriate;
- VS Code high-contrast themes;
- no information conveyed only through color.

============================================================
57. PERFORMANCE
============================================================

The extension must remain responsive.

Do not:

- reparse entire workspace on every keystroke unnecessarily;
- scan thousands of symbols repeatedly;
- rebuild the command registry constantly.

Use:

- cached normalized database;
- incremental analysis where practical;
- debounced document analysis;
- lookup maps.

Example:

Map<string, Cs2Symbol>

for command lookup.

============================================================
58. GENERATED DATABASE UPDATE PIPELINE
============================================================

Create or design for an automated importer.

Pipeline:

GameTracking / Source 2 data
          ↓
download/update
          ↓
parser
          ↓
normalizer
          ↓
schema validation
          ↓
compare previous snapshot
          ↓
generated metadata
          ↓
tests

Detect:

- commands added;
- commands removed;
- default changes;
- flag changes;
- description changes;
- range changes.

Generate a diff artifact suitable for review.

Do not automatically publish broken metadata.

============================================================
59. OPTIONAL DATABASE PACKAGE
============================================================

Design the command database so it could eventually be extracted into:

@cs2-config-tools/database

Possible future API:

import { getConVar } from "@cs2-config-tools/database";

const fpsMax = getConVar("fps_max");

This is not required for the first implementation.

But domain boundaries should make extraction possible.

============================================================
60. TESTING STRATEGY
============================================================

Testing is mandatory.

Use unit tests for:

- lexer;
- parser;
- AST;
- serializer;
- command registry;
- fuzzy matching;
- diagnostics;
- binds;
- aliases;
- exec resolution;
- effective state;
- migrations;
- generator output.

Use fixture tests for real CFGs.

Example fixtures:

tests/fixtures/
├── minimal.cfg
├── autoexec.cfg
├── practice.cfg
├── legacy.cfg
├── invalid.cfg
├── duplicate-binds.cfg
├── aliases.cfg
├── exec/
└── complex.cfg

============================================================
61. GOLDEN TESTS
============================================================

Use golden/snapshot tests carefully for:

- formatter;
- generators;
- semantic config diff;
- autoexec templates;
- practice config output.

Ensure tests are deterministic.

============================================================
62. DATABASE VALIDATION TESTS
============================================================

Validate:

- duplicate command names;
- invalid lifecycle values;
- impossible ranges;
- enum conflicts;
- replacements pointing to missing commands;
- malformed provenance;
- duplicate curated records;
- generated/curated merge conflicts.

============================================================
63. LANGUAGE UX TESTS
============================================================

Test scenarios such as:

fps_max "400"

fps_max "banana"

cl_crosshair_lenght "8"

bind "F1" "bot_place"
bind "F1" "buy awp"

alias "bots_freeze" "bot_stop 1"
bind "F4" "bots_freeze"

exec practice

exec missing_config

Ensure expected diagnostics and hovers.

============================================================
64. DOCUMENTATION QUALITY
============================================================

Do not use generic tautological descriptions such as:

"Configure the radar scale."

for:

cl_radar_scale

Prefer:

"Controls how much of the map is visible on the radar. Lower values show a larger portion of the map."

ONLY if that behavior is verified.

Descriptions must explain effect, not restate name.

============================================================
65. USER-FACING LANGUAGE
============================================================

Avoid internal terminology like:

- corpus observation;
- runtime corpus;
- selected console report;
- unresolved evidence state;
- ingestion confidence.

Internal model can use these concepts.

User-facing UI should say:

- Active
- Legacy
- Removed
- Requires sv_cheats
- Not documented by Valve
- Community description
- Verified in current build
- Runtime behavior not independently confirmed

Use plain English.

============================================================
66. STRICT UNCERTAINTY RULE
============================================================

If the extension knows:

command exists

but does NOT know:

exact unit

then say:

Command status: Active
Unit: Not documented

Do NOT degrade the entire command to:

"unverified"

This distinction is extremely important.

============================================================
67. PRODUCT UX PRINCIPLE
============================================================

The extension should help users answer:

"What is wrong with my config?"

"What does this line do?"

"Does this still work?"

"Is this command current?"

"What value am I effectively using?"

"Which key is actually bound?"

"What changed after the CS2 update?"

"Can I build this config visually?"

"Can I safely clean this old autoexec?"

Every feature should help answer one of those questions.

============================================================
68. DEVELOPMENT ROADMAP
============================================================

Implement incrementally.

Do NOT attempt all features at once.

PHASE 0 — AUDIT

- inspect repository;
- document current architecture;
- identify technical debt;
- identify command data sources;
- identify current parser limitations;
- identify current diagnostic architecture;
- identify current tests;
- create implementation plan.

Output:
ARCHITECTURE_AUDIT.md

Do not modify production code before understanding current structure.

============================================================
PHASE 1 — DATA MODEL AND CURATION
============================================================

Goals:

- normalized command model;
- provenance model;
- lifecycle model;
- generated vs curated separation;
- command registry;
- schema validation.

Tasks:

- create/refactor domain metadata;
- import current command data;
- improve source hierarchy;
- remove raw pipeline wording from user-facing docs;
- create deterministic database merge.

Tests required.

============================================================
PHASE 2 — CORE LANGUAGE ENGINE
============================================================

Goals:

- reliable parser;
- source ranges;
- bind parsing;
- alias parsing;
- exec parsing;
- command sequences;
- comments preservation.

Do not overbuild CST yet if AST + source trivia is sufficient.

============================================================
PHASE 3 — HOVER AND DOCUMENTATION
============================================================

Goals:

- useful human descriptions;
- current/default/type;
- range;
- enums;
- flags;
- lifecycle;
- requirements;
- source/build info.

Remove poor messages such as:

"Observed corpus examples..."

Replace with polished documentation UX.

============================================================
PHASE 4 — DIAGNOSTICS
============================================================

Implement:

- syntax errors;
- type errors;
- invalid values;
- unknown commands;
- typo suggestions;
- legacy;
- removed;
- duplicate/rebound keys;
- overwritten assignments;
- cheat-only info;
- unused aliases;
- missing exec files.

Correct severity.

Add configurable diagnostics.

============================================================
PHASE 5 — CODE ACTIONS AND NAVIGATION
============================================================

Implement:

- Quick Fix;
- typo replacement;
- remove obsolete;
- go to alias;
- alias references;
- exec file navigation;
- missing exec suggestions.

============================================================
PHASE 6 — INLAY HINTS / SYMBOL UX
============================================================

Implement:

- boolean labels;
- enum labels;
- bind action labels;
- weapon slot labels;
- buy bind interpretation.

Optional:
color decorators.

============================================================
PHASE 7 — HEALTH CHECK
============================================================

Implement:

CS2 Config Tools: Inspect Current Config

Summarize:

- valid;
- unknown;
- legacy;
- removed;
- duplicate;
- overwritten;
- default-valued;
- cheat-only.

Start with textual output.

============================================================
PHASE 8 — VISUAL BIND MAP
============================================================

Before full Autoexec Builder, build:

View Key Bindings

Reason:

- validates keyboard model;
- validates bind parser;
- validates WebView architecture;
- provides immediate utility;
- smaller scope than full generator.

Read existing config and visualize effective bindings.

============================================================
PHASE 9 — AUTOEXEC BUILDER MVP
============================================================

Implement:

- templates;
- keyboard;
- mouse;
- numpad buy binds;
- action selection;
- conflict detection;
- live CFG preview;
- generation;
- safe file creation.

Do not initially implement every setting.

Focus on binds and common settings first.

============================================================
PHASE 10 — CONFIG BUILDERS
============================================================

Add:

- Crosshair Builder;
- Radar Builder;
- Practice Config Builder;
- Audio settings;
- HUD settings.

All driven from shared command metadata.

============================================================
PHASE 11 — IMPORT AND ROUND-TRIP
============================================================

Implement:

Open Existing Config in Visual Editor

Initially:

parse → visual representation

Then:

controlled editing → source updates

Preserve comments and structure where practical.

============================================================
PHASE 12 — EFFECTIVE STATE / WORKSPACE
============================================================

Implement:

- multi-file exec resolution;
- dependency graph;
- effective values;
- effective binds;
- cycles;
- workspace view.

============================================================
PHASE 13 — CLEAN / COMPARE / MIGRATE
============================================================

Implement:

- Config Cleaner;
- Semantic Compare;
- Migration framework;
- update compatibility checks.

============================================================
PHASE 14 — AUTOMATED DATA UPDATES
============================================================

Add CI pipeline to:

- fetch authoritative metadata;
- normalize;
- compare;
- validate;
- generate PR/update artifact.

Never silently publish command changes without validation.

============================================================
69. MVP DEFINITION
============================================================

Do NOT call the project complete when only syntax highlighting exists.

A strong v0.1 should include:

- CFG language registration;
- syntax highlighting;
- parser;
- command registry;
- command/convar completion;
- high-quality hover;
- diagnostics;
- unknown-command detection;
- typo suggestions;
- legacy/removed distinction;
- bind analysis;
- alias support;
- exec resolution;
- formatter;
- quick fixes;
- test suite.

Then v0.2:

- Config Health Check;
- visual bind map;
- Autoexec Builder MVP.

============================================================
70. UI DESIGN
============================================================

Visual identity:

Project:
CS2 Config Tools

General style:

- professional;
- simple;
- technical;
- developer-tool oriented;
- compatible with VS Code themes.

Avoid:
- emoji-heavy UI;
- gamer-dashboard clutter;
- glassmorphism;
- excessive gradients;
- giant cards;
- unnecessary decorative elements.

Use VS Code design language.

============================================================
71. ERROR HANDLING
============================================================

No silent failures.

When metadata is incomplete:

show useful fallback.

When a WebView command fails:

show actionable error.

When parser cannot resolve construct:

do not crash entire document analysis.

Prefer partial analysis.

============================================================
72. LOGGING
============================================================

Create a dedicated output channel:

CS2 Config Tools

Logging levels where appropriate:

error
warning
info
debug

Do not spam normal users.

Debug logging should be configurable.

============================================================
73. TELEMETRY / PRIVACY
============================================================

Do not add telemetry unless explicitly required.

If telemetry is ever considered:

- opt-in or comply strictly with VS Code/Marketplace requirements;
- never collect CFG contents unnecessarily;
- document exactly what is collected.

For now:
prefer no telemetry.

============================================================
74. DOCUMENTATION
============================================================

Maintain:

README.md
CONTRIBUTING.md
ARCHITECTURE.md
DATA_SOURCES.md
COMMAND_DATABASE.md
CHANGELOG.md

DATA_SOURCES.md should explain:

- source hierarchy;
- generated metadata;
- curated metadata;
- provenance;
- uncertainty;
- lifecycle rules.

============================================================
75. AGENTS / AI DEVELOPMENT GUIDANCE
============================================================

If AGENTS.md exists, update it to state:

- never invent CS2 command behavior;
- always use registry/domain APIs;
- generated data cannot be manually edited;
- curated data must include evidence;
- UI must not duplicate command logic;
- all diagnostics require tests;
- all parser changes require fixtures;
- formatter must preserve semantics;
- migration fixes must be conservative;
- WebViews must be theme-aware;
- all new features must preserve extension performance.

============================================================
76. QUALITY BAR
============================================================

Do not produce placeholder architecture that only compiles.

A feature is complete only when:

1. implementation exists;
2. tests exist;
3. error states are handled;
4. types are correct;
5. documentation is updated;
6. UX wording is polished;
7. no duplicated domain logic exists;
8. build/lint/tests pass.

============================================================
77. CURRENT PRIORITY
============================================================

The immediate priority is NOT the Autoexec Builder yet.

First improve the foundation.

Current work should prioritize:

1. repository audit;
2. command metadata model;
3. provenance;
4. command curation;
5. hover quality;
6. diagnostics quality;
7. bind/alias/exec analysis;
8. tests.

After those foundations are stable:

build the Visual Bind Map.

Then:

Autoexec Builder.

This order ensures that the visual generator reuses trustworthy domain logic instead of becoming a second disconnected system.

============================================================
78. INITIAL EXECUTION INSTRUCTIONS
============================================================

Begin by doing the following:

STEP 1
Inspect the entire repository.

STEP 2
Produce a concise architecture report covering:

- current folder structure;
- current runtime flow;
- parser implementation;
- command metadata implementation;
- completion implementation;
- hover implementation;
- diagnostics implementation;
- test strategy;
- WebView presence;
- technical debt;
- architectural risks.

STEP 3
Compare current architecture against the target architecture described here.

STEP 4
Create a phased implementation plan.

For each phase include:

- objective;
- affected files;
- new modules;
- refactors;
- tests;
- risks;
- acceptance criteria.

STEP 5
Start only with the first approved phase.

Do not implement all phases in one massive change.

Do not delete working functionality simply because a cleaner architecture is proposed.

Prefer small, reviewable, testable iterations.

============================================================
79. DEFINITION OF SUCCESS
============================================================

A successful CS2 Config Tools experience should eventually allow a user to:

Open an old autoexec.cfg.

Immediately see:

- what still works;
- what is legacy;
- what is invalid;
- what is redundant;
- which binds conflict;
- which values actually win;
- what each command does;
- where each fact came from.

Then click:

View Key Bindings

and see the config visually mapped onto keyboard/mouse.

Then click:

Edit Visually

change:

P → Team Chat
X → Smoke
NUM2 → AK/M4

and see the generated CFG update immediately.

Then open:

Crosshair Builder

or:

Practice Config Builder

and modify those sections visually.

Then run:

Inspect Current Config

and obtain a trustworthy health report.

After a CS2 update, the extension should eventually say:

"2 commands used by your configuration changed in this build."

That is the product vision.

Build toward that vision incrementally and rigorously.

============================================================
80. FINAL ENGINEERING RULE
============================================================

CS2 Config Tools must never become a collection of unrelated features.

There must be one shared source of truth:

Command Registry
+
CFG Language Model
+
Static Analysis Engine

Everything else:

Autocomplete
Hover
Diagnostics
Visual Builder
Documentation
Health Check
Migration
Diff
Practice Generator
Crosshair Builder

must consume those same foundations.

Architecture first.
Correctness second.
UX third.
Feature count last.