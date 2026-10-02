# Command database and registry

The database stores reviewed facts; the registry exposes them to all consumers. Generated catalog JSON is an offline artifact, not an editable source of truth.

| Concern      | Target contract                                                                         |
| ------------ | --------------------------------------------------------------------------------------- |
| Identity     | Name and known command/convar kind; unknown is explicit                                 |
| Parameters   | Supported signature, type, range, enum meanings and default                             |
| Description  | Original English help separate from community English and pt-BR                         |
| Lifecycle    | Active, deprecated, legacy, removed or unknown, scoped to evidence/build                |
| Availability | Client/server context and cheats/development/hidden flags, separate from lifecycle      |
| Examples     | Reviewed explanatory examples separate from corpus inputs                               |
| History      | First/last observation and verification when available                                  |
| Provenance   | Evidence per fact, source reference, scope and confidence                               |
| Migration    | Verified applicability and value transformation; a preferred name alone is insufficient |

The generated catalog now uses schema version 2: symbol kind, catalog status, lifecycle, documentation-review state, field provenance and technical snapshot facts are distinct. The registry is implemented in `src/catalog/registry.ts`; this is still an initial contract, not the complete long-term model. Extension version, schema version, data revision and game build identify different things.

## Validation and shared access

Validate source files and the merged result. Reject duplicate identities, unresolved conflicts, malformed ranges, unsupported enum values, invalid source references and impossible defaults. Check replacement targets and cycles where rules exist. Preserve build-specific disagreements rather than resolving them through object merge order.

Generation must be deterministic and `catalog:check` must detect drift. Test invalid inputs and conflicts rather than permanent command totals. Never hand-edit `catalog/catalog.json`.

The editor-independent registry under `src/catalog/` provides indexed lookup and a shared normal/advanced suggestion policy. Editor services expose its lookup to existing providers and its full name set to diagnostics. Future documentation, health and builders must consume this infrastructure. Reusable command semantics belong in reviewed data or domain services, not provider-local lists.

Introduce semantic actions only as verified. Bind/alias/exec structural behavior must be shared; buy and inventory actions need reviewed definitions before builders can explain them confidently. Unknown semantics remain representable and must not prevent source preservation.

The first increment routes existing features through the registry without rewriting the parser or renaming user settings. Move duplicated evidence and action lists incrementally with regression coverage.

## Constraint consumers

Use registry `applicableParameter` and `parameterBounds` rather than reimplementing source precedence. Compatible curated subsets constrain the reviewed editor domain; explicitly scoped parameters for another build are not current defaults or accepted ranges. Catalog validation rejects unresolved applicable conflicts before generation. Complete-action human meaning uses shared core action-shape checks; a recognized command name alone does not validate its arguments.
