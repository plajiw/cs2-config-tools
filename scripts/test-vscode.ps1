$ErrorActionPreference = 'Stop'
# The Node runner records the native close result and owns a unique profile/output/process.
& node.exe (Join-Path $PSScriptRoot 'test-vscode.cjs')
exit $LASTEXITCODE
