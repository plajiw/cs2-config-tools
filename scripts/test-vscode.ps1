$ErrorActionPreference = 'Stop'
$workspacePath = Split-Path -Parent $PSScriptRoot
$vscodeExe = if ($env:CS2_CFG_VSCODE) { $env:CS2_CFG_VSCODE } else { Join-Path $env:LOCALAPPDATA 'Programs\Microsoft VS Code\Code.exe' }
if (!(Test-Path -LiteralPath $vscodeExe)) { throw 'Set vscodeExe to your local VS Code executable.' }
$logPath = Join-Path $workspacePath '.test-output'
New-Item -ItemType Directory -Path $logPath -Force | Out-Null
$profilePath = Join-Path $workspacePath '.vscode-test\profile'
$testExtensionsPath = Join-Path $workspacePath '.vscode-test\extensions'
New-Item -ItemType Directory -Path $testExtensionsPath -Force | Out-Null
$extensionPath = if ($env:CS2_CFG_EXTENSION_PATH) { $env:CS2_CFG_EXTENSION_PATH } else { $workspacePath }
$testPath = Join-Path $workspacePath 'tests\integration\index.cjs'
$previousElectronMode = $env:ELECTRON_RUN_AS_NODE
try {
    Remove-Item Env:ELECTRON_RUN_AS_NODE -ErrorAction SilentlyContinue
    $testProcess = Start-Process -FilePath $vscodeExe -WindowStyle Hidden -ArgumentList @('--disable-gpu','--disable-workspace-trust',('--extensions-dir="' + $testExtensionsPath + '"'),('--user-data-dir="' + $profilePath + '"'),('--extensionDevelopmentPath="' + $extensionPath + '"'),('--extensionTestsPath="' + $testPath + '"')) -PassThru -RedirectStandardOutput (Join-Path $logPath 'vscode.stdout.log') -RedirectStandardError (Join-Path $logPath 'vscode.stderr.log')
    if (!$testProcess.WaitForExit(60000)) { $testProcess.Kill(); throw 'VS Code integration timed out.' }
    Select-String -LiteralPath (Join-Path $logPath 'vscode.stdout.log'), (Join-Path $logPath 'vscode.stderr.log') -Pattern 'PASS:|AssertionError|at exports.run|Error:|Code exit'
    if (!(Select-String -LiteralPath (Join-Path $logPath 'vscode.stdout.log') -Pattern 'PASS: Extension Host integration' -Quiet)) { throw 'Integration tests did not report success.' }
} finally {
    if ($null -ne $previousElectronMode) { $env:ELECTRON_RUN_AS_NODE = $previousElectronMode }
    else { Remove-Item Env:ELECTRON_RUN_AS_NODE -ErrorAction SilentlyContinue }
}
