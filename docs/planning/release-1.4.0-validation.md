# Local release and installation — 2026-10-02

The user explicitly requested updating their usual VS Code. Compared with the immutable 1.3.0 package reference (`F69043E87FA1C98324C2FE19373F091F87594A3A443C5C973C6B37DB5BAF1CF8`), the accumulated working tree adds Autoexec Builder and shared inventory-slot meanings alongside the documented audit corrections. The new user-facing builder capability requires a compatible minor release: **1.4.0**. Existing packages were preserved; preview status remains.

Manifest, lockfile and generated catalog are synchronized. Shipped Unreleased notes moved into the dated changelog section. Catalog generation/check, build, 97 unit tests and source style passed. Previous correction acceptance includes browser matrices and three isolated host runs; see the [correction report](../audits/full-project-audit-2026-10-02-corrections.md).

`npm run package` generated `artifacts/cs2-config-tools-1.4.0.vsix`. ZIP inspection confirmed the builder assets, ordered-alias/value helpers, bounded reader, link scheduler and catalog, and excluded development sources, tests, fixtures and audit artifacts. SHA-256: `6BF999E2BD6ECF40A3426CA8D4ED2A415809547E1FF66C928DB8C390A8719874`.

The usual local VS Code CLI reported VS Code 1.140.0 and successfully installed the new VSIX; `--list-extensions --show-versions` confirmed `plajiw.cs2-config-tools@1.4.0`. An already open window may need **Developer: Reload Window** to activate the new extension instance. Future explicitly requested distributions should also be installed locally, as recorded in AGENTS. No Marketplace publication, Git tag or game execution occurred.

The packaged-provider host check passed using the extracted VSIX in isolated VS Code 1.96.4, with explicit Builder and Extension Host PASS markers in `.test-output/corrections/release-package-integration.log` (owned run `integration-NmBXzP`). No personal editor profile is used for those tests. Local logs remain ignored and package validation is not proof of game command acceptance.
