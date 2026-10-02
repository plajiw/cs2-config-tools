const vscode = require('vscode');
const fs = require('node:fs');
const path = require('node:path');
exports.run = async () => {
  const output = process.env.CS2_BIND_VISUAL_OUTPUT;
  if (!output) throw new Error('Run scripts/capture-bind-map-host.cjs');
  const root = path.resolve(__dirname, '../..');
  const manifest = require(path.join(root, 'package.json'));
  await vscode.extensions.getExtension(manifest.publisher + '.' + manifest.name).activate();
  await vscode.workspace
    .getConfiguration('workbench')
    .update(
      'colorTheme',
      process.env.CS2_BIND_VISUAL_THEME || 'Default Dark Modern',
      vscode.ConfigurationTarget.Global,
    );
  await vscode.workspace
    .getConfiguration('cs2Config')
    .update('descriptionLanguage', 'en', vscode.ConfigurationTarget.Global);
  let doc = await vscode.workspace.openTextDocument(
    vscode.Uri.file(path.join(output, 'visual.cfg')),
  );
  doc = await vscode.languages.setTextDocumentLanguage(doc, 'cs2cfg');
  await vscode.window.showTextDocument(doc);
  await vscode.commands.executeCommand('cs2Config.bindMap');
  await vscode.commands.executeCommand('workbench.action.joinAllGroups');
  // Activation has completed; dismiss startup notices before visual inspection.
  await vscode.commands.executeCommand('notifications.clearAll');
  fs.writeFileSync(path.join(output, 'ready'), 'ready');
  const deadline = Date.now() + 180000;
  while (!fs.existsSync(path.join(output, 'done'))) {
    if (Date.now() > deadline) throw new Error('Visual capture timed out');
    await new Promise((resolve) => setTimeout(resolve, 200));
  }
};
