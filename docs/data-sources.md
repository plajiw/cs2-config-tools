# Data sources and evidence

Command presence, accepted parameters, permission and observed effect are separate claims. A snapshot date is not an installed game build.

Prefer identified game dumps and controlled runtime observations for the facts they demonstrate, then tracked Source 2 data, Valve documentation, bundled configurations and reviewed community documentation. Project curation supplies explanations and translations. This review order does not justify silently overwriting conflicting evidence.

Current sources include pinned community parameter and tracked crosshair snapshots, CFG examples and a console report without a build identifier. See `catalog/source/` and [crosshair notes](crosshair.md). Some original descriptions, restrictions and runtime behavior remain unverified.

Record source identifier, kind, location, immutable revision or hash, retrieval time, source time, build when available, context and attribution/license. Attach evidence to individual facts: a range may have a different origin and confidence from a translated description or removal claim.

Unknown values remain unknown. Keep documentation confidence separate from runtime verification. Hidden status is not removed status; absence from a dump is insufficient removal evidence.

## Review pipeline

1. Fetch raw evidence explicitly and preserve revision/hash.
2. Normalize candidates without changing the published catalog.
3. Review differences, conflicts, source terms and bilingual labels.
4. Curate accepted facts and provenance in `catalog/source/`.
5. Validate and generate the offline artifact deterministically.
6. Review generated changes and regressions before distribution.

`catalog:fetch -- --current` discovers all records in `DumpSource2/convars.txt` and `commands.txt` at one resolved SHA. It writes raw files, a generated candidate index, a JSON diff and `UPDATE_REPORT.md` under `catalog/candidates/`. `--revision <SHA>` reproduces a fixed revision. The published catalog remains unchanged until an explicit promotion and rebuild.

`catalog:promote -- --reviewed <SHA>` requires the exact candidate revision and checks raw hashes/reparsed records before writing `catalog/source/technical.json`. Review means acceptance of the technical extraction, not runtime verification or human documentation. The registry recognizes the complete promoted index; default completion filters explicit internal/development/hidden flags.

Candidate snapshots are **discovered**; promoted technical records are **verified** against their source snapshot; records with reviewed project explanations are **curated**. These states do not imply an installed build, execution permission or lifecycle status. `snapshot-verified` confidence belongs to individual extracted facts; community text retains community provenance. `dumpValue` is a recorded value, not an inferred default. Game build remains null when not established.

SteamTracking provenance is labeled **Source 2 runtime dump via SteamTracking/GameTracking-CS2**, never “Valve official.” Lifecycle stays unknown unless separately evidenced. Missing entries in the update report are not automatically marked removed. Future automated updates should propose reviewable changes, not publish facts automatically.

Never execute an inventory indiscriminately. Runtime verification records the environment, exact input/output and restoration procedure. Editor fixtures demonstrate syntax and observed examples only.

Scoreboard and mouse-axis descriptions cite [the tracked CS2 default key file](https://github.com/SteamTracking/GameTracking-CS2/blob/c3b892a3363a9b0275fc901f1960acac9f10b26b/game/csgo/cfg/user_keys_default.vcfg): TAB uses +showscores; analog MOUSE_X/MOUSE_Y use yaw/pitch. Revision, content hash and retrieval date are recorded in the source metadata. This is bundled-configuration evidence, separate from runtime-dump and game-build verification.

## Inventory slot human semantics

The Autoexec Builder milestone supplied a reviewed slot mapping on 2026-10-02. Its bilingual labels/descriptions are project community curation in catalog/source/descriptions.json; editorial.meaning records project-curation as source, community confidence, high/tentative strength, review date and contextual notes. This is the provenance of the supplied semantic proposal, not independent game runtime evidence or Valve authorship. Original help, snapshot presence and runtime.verifiedInGame remain untouched. slot11 is community/high, slot12 mode-dependent, slot13 tentative and not promoted to a primary human label. No exact slot3 cycling or possession of unavailable equipment is inferred.

## Applicable constraint integrity

Generation rejects incompatible curated bounds, enum members or defaults against applicable technical domains. A reviewed curated subset remains the effective supported subset. Technical enum names alone do not establish members; an explicit literal member list requires technical field provenance. A parameter scope must name a reviewed source whose build ID matches its declared scope, with an identified snapshot build before differing technical facts can be separated. Differently scoped parameters are retained as evidence but are not mixed into current-snapshot validation, completion or documentation. Unknown build applicability does not authorize an override.
