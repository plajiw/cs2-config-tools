const vscode = require('vscode');
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');

async function undoDocument(document, expected) {
  await vscode.window.showTextDocument(document, { preview: false });
  await vscode.commands.executeCommand('workbench.action.focusActiveEditorGroup');
  assert.equal(vscode.window.activeTextEditor?.document.uri.toString(), document.uri.toString());
  await vscode.commands.executeCommand('undo');
  // The UI command response and extension-host document notification use
  // separate IPC messages. Never issue a second undo while waiting for the first.
  const deadline = Date.now() + 3000;
  while (document.getText() !== expected && Date.now() < deadline)
    await new Promise((resolve) => setTimeout(resolve, 25));
  assert.equal(document.getText(), expected, 'Normal editor undo restores exact source');
}

exports.checkBuilder = async (root) => {
  const { CommandRegistry } = require(path.join(root, 'dist/catalog/registry'));
  const { previewBinds } = require(path.join(root, 'dist/core/bind-builder'));
  const { applyBuilderSnapshot } = require(path.join(root, 'dist/vscode/autoexec-builder'));
  const registry = new CommandRegistry(require(path.join(root, 'catalog/catalog.json')));
  const output = fs.mkdtempSync(
    path.join(
      process.env.CS2_CFG_TEST_OUTPUT || path.join(root, '.test-output'),
      'builder-integration-',
    ),
  );
  const source = '// synthetic\r\nbind "x" "slot8" // keep\r\nsensitivity "1.4"\r\n';
  const uri = vscode.Uri.file(path.join(output, 'existing.cfg'));
  fs.writeFileSync(uri.fsPath, source);
  const doc = await vscode.workspace.openTextDocument(uri);
  await vscode.window.showTextDocument(doc);
  const changes = [{ key: 'x', action: { command: 'slot7', parameters: [] }, replace: true }];
  const snapshot = () => ({
    uri,
    document: doc,
    version: doc.version,
    disk: fs.readFileSync(uri.fsPath, 'utf8'),
    preview: previewBinds(doc.getText(), changes, registry),
  });
  const cancelled = snapshot();
  assert.equal(doc.getText(), source, 'Preview/cancel never changes buffer');
  assert.equal(fs.readFileSync(uri.fsPath, 'utf8'), source, 'Preview/cancel never writes disk');
  await applyBuilderSnapshot(cancelled, () => {});
  assert.equal(doc.getText(), source.replace('slot8', 'slot7'));
  assert.equal(fs.readFileSync(uri.fsPath, 'utf8'), source, 'Existing edits remain unsaved');
  await undoDocument(doc, source);
  const stale = snapshot();
  const editor = await vscode.window.showTextDocument(doc);
  await editor.edit((e) => e.insert(new vscode.Position(0, 0), '// external buffer edit\r\n'));
  await assert.rejects(
    applyBuilderSnapshot(stale, () => {}),
    /stale/,
  );
  await undoDocument(doc, source);
  const diskStale = snapshot();
  fs.writeFileSync(uri.fsPath, source + '// changed on disk');
  await assert.rejects(
    applyBuilderSnapshot(diskStale, () => {}),
    /stale/,
  );
  const newUri = vscode.Uri.file(path.join(output, 'new-autoexec.cfg'));
  const newSnapshot = {
    uri: newUri,
    disk: undefined,
    preview: previewBinds('', changes, registry),
  };
  fs.writeFileSync(newUri.fsPath, '// appeared after preview');
  await assert.rejects(
    applyBuilderSnapshot(newSnapshot, () => {}),
    /stale/,
  );
  assert.equal(fs.readFileSync(newUri.fsPath, 'utf8'), '// appeared after preview');
  const exclusive = vscode.Uri.file(path.join(output, 'exclusive.cfg'));
  await applyBuilderSnapshot({ ...newSnapshot, uri: exclusive }, () => {});
  const created = await vscode.workspace.openTextDocument(exclusive);
  assert.equal(created.getText(), 'bind "x" "slot7"');
  const slotDoc = await vscode.workspace.openTextDocument({ language: 'cs2cfg', content: 'slot8' });
  const hovers = await vscode.commands.executeCommand(
    'vscode.executeHoverProvider',
    slotDoc.uri,
    new vscode.Position(0, 3),
  );
  assert.ok(
    hovers
      .flatMap((h) => h.contents)
      .some((c) => (c.value || '').replace(/&nbsp;/g, ' ').includes('Smoke Grenade')),
  );
  console.log(
    'PASS: Autoexec Builder: undo, stale buffer/disk, exclusive creation, comments/CRLF and shared hover.',
  );
};

exports.run = async () => {
  if (process.env.CS2_BUILDER_VISUAL_THEME)
    await vscode.workspace
      .getConfiguration('workbench')
      .update(
        'colorTheme',
        process.env.CS2_BUILDER_VISUAL_THEME,
        vscode.ConfigurationTarget.Global,
      );
  const output = process.env.CS2_BUILDER_VISUAL_OUTPUT;
  if (!output) throw new Error('Run scripts/capture-autoexec-builder-host.cjs');
  const root = path.resolve(__dirname, '../..');
  const manifest = require(path.join(root, 'package.json'));
  await vscode.extensions.getExtension(manifest.publisher + '.' + manifest.name).activate();
  await vscode.workspace
    .getConfiguration('cs2Config')
    .update('descriptionLanguage', 'en', vscode.ConfigurationTarget.Global);
  await exports.checkBuilder(root);
  await vscode.commands.executeCommand(
    'cs2Config.autoexecBuilder',
    vscode.Uri.file(path.join(output, 'visual.cfg')),
  );
  await vscode.commands.executeCommand('workbench.action.joinAllGroups');
  await vscode.commands.executeCommand('notifications.clearAll');
  fs.writeFileSync(path.join(output, 'ready'), 'ready');
  const deadline = Date.now() + 180000;
  while (!fs.existsSync(path.join(output, 'done'))) {
    if (
      fs.existsSync(path.join(output, 'empty-request')) &&
      !fs.existsSync(path.join(output, 'empty-active'))
    ) {
      const emptyUri = vscode.Uri.file(path.join(output, 'empty-autoexec.cfg'));
      fs.writeFileSync(emptyUri.fsPath, '');
      await vscode.commands.executeCommand('cs2Config.autoexecBuilder', emptyUri);
      fs.writeFileSync(path.join(output, 'empty-active'), 'ready');
    }
    if (Date.now() > deadline) throw new Error('Builder visual capture timed out');
    await new Promise((resolve) => setTimeout(resolve, 200));
  }
};
