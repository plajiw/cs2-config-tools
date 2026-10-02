# CS2 Config Tools — project vision

CS2 Config Tools is a community project for understanding, editing and maintaining Counter-Strike 2 CFG files. Reliable language tooling and traceable command data come first; visual editing builds on that foundation.

English is the source language for documentation and community descriptions. Brazilian Portuguese is supported through translations and extension settings. Command names and parameter literals remain unchanged across languages.

## One shared model

The command registry supplies the same definitions, parameters, restrictions and evidence to documentation, completion, analysis and future builders. A keyboard builder must not maintain its own interpretation of `slot8`, `messagemode`, `buy ak47` or `cl_radar_scale`.

The language engine preserves source locations and distinguishes written statements from deferred execution. Static analysis produces findings and an effective configuration model with explicit uncertainty. Visual tools consume that model and submit structured changes to shared validation and source-writing services.

## Implementation order

1. Strengthen command data, provenance and the registry.
2. Improve parsing, documentation, analysis and safe editor actions.
3. Establish effective configuration analysis and a useful health report.
4. Add a read-only visual bind map, then an Autoexec Builder.
5. Extend builders, source-preserving edits, workspace analysis and migration.

This is a dependency order, not a release schedule. Preserve working features during incremental development. Versions live in `package.json`; acceptance depends on behavior and evidence rather than catalog totals.

## Quality and scope

- Formatting preserves order, comments, quoted values and deferred bodies.
- Documentation explains parameters directly and distinguishes original game help, community writing and observed examples.
- Missing evidence remains unknown. Hidden flags, absent entries and isolated console reports do not prove removal or equivalent replacements.
- Editing works offline; data importing is an explicit development operation.
- Analysis distinguishes confirmed problems from incomplete coverage and uncertain execution.
- Generated changes are previewable and preserve unrelated content.
- Editor tests do not replace identified game-build/runtime verification.

Health checks and the read-only visual bind map now provide single-file exploration. The Autoexec Builder MVP now supplies reviewed simple-bind edits. Specialized builders, workspace analysis and migration remain planned. Templates explain their purpose without universal FPS claims. No automatic CFG execution, game-installation changes or default telemetry belong in the editor workflow.

## Maintained documents

The [master specification](docs/planning/master-specification.md) is preserved verbatim as the source proposal. Example values, interfaces, folder trees and version numbers are illustrative, not verified CS2 facts or a mandate to implement every feature immediately. The user's foundation-first priority guides the maintained documents.

- [Architecture](docs/architecture.md): responsibilities and dependencies.
- [Data sources](docs/data-sources.md) and [command database](docs/command-database.md): evidence and contracts.
- [Architecture audit](docs/planning/architecture-audit.md): current state and gaps.
- [Implementation plan](docs/planning/implementation-plan.md): phases and acceptance.
- [Agent instructions](AGENTS.md): practical contribution rules.
