const vscode = require('vscode');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
exports.run = async () => {
  const root = path.resolve(__dirname, '../..');
  const manifest = require(path.join(root, 'package.json'));
  const extension = vscode.extensions.getExtension(`${manifest.publisher}.${manifest.name}`);
  assert.ok(extension, 'Extension is installed in the development host');
  await extension.activate();
  const directory = path.join(root, '.test-output');
  fs.mkdirSync(directory, { recursive: true });
  fs.writeFileSync(path.join(directory, 'practice.cfg'), 'bot_add_t\n');
  const fixture = path.join(directory, 'integration.cfg');
  const text =
    'alias custom "bot_add_t"\ncustom\nbind "F2" "bot_ad"\nexec practice.cfg\ncl_crosshairgap -3\n';
  fs.writeFileSync(fixture, text);
  let doc = await vscode.workspace.openTextDocument(vscode.Uri.file(fixture));
  doc = await vscode.languages.setTextDocumentLanguage(doc, 'cs2cfg');
  await vscode.window.showTextDocument(doc);
  const settings = vscode.workspace.getConfiguration('cs2Config', doc.uri);
  await settings.update('descriptionLanguage', 'en', vscode.ConfigurationTarget.Global);
  await settings.update(
    'consoleEvidence',
    'user-report-2026-10-01',
    vscode.ConfigurationTarget.Global,
  );
  const completions = await vscode.commands.executeCommand(
    'vscode.executeCompletionItemProvider',
    doc.uri,
    new vscode.Position(2, 17),
  );
  assert.ok(
    completions.items.some((item) => item.label === 'bot_add_t'),
    'Completion inside bind',
  );
  const english = await vscode.commands.executeCommand(
    'vscode.executeHoverProvider',
    doc.uri,
    new vscode.Position(4, 5),
  );
  const hoverText = (results) =>
    results
      .flatMap((hover) => hover.contents)
      .map((content) => content.value ?? String(content))
      .join('\n')
      .replace(/&nbsp;/g, ' ');
  assert.ok(
    hoverText(english).includes('Historical crosshair gap'),
    `English hover: ${hoverText(english)}`,
  );
  await settings.update('descriptionLanguage', 'pt-BR', vscode.ConfigurationTarget.Global);
  const internalDoc = await vscode.workspace.openTextDocument({
    language: 'cs2cfg',
    content: 'lb_debug_silhouette',
  });
  const internalSettings = vscode.workspace.getConfiguration('cs2Config', internalDoc.uri);
  await internalSettings.update('completionMode', 'normal', vscode.ConfigurationTarget.Global);
  const internalPosition = new vscode.Position(0, internalDoc.lineAt(0).text.length);
  const normal = await vscode.commands.executeCommand(
    'vscode.executeCompletionItemProvider',
    internalDoc.uri,
    internalPosition,
  );
  assert.ok(
    !normal.items.some((item) => item.label === 'lb_debug_silhouette'),
    'Normal mode hides development symbols',
  );
  await internalSettings.update('completionMode', 'advanced', vscode.ConfigurationTarget.Global);
  const advanced = await vscode.commands.executeCommand(
    'vscode.executeCompletionItemProvider',
    internalDoc.uri,
    internalPosition,
  );
  assert.ok(
    advanced.items.some((item) => item.label === 'lb_debug_silhouette'),
    'Advanced mode exposes indexed symbols',
  );
  const internalHover = await vscode.commands.executeCommand(
    'vscode.executeHoverProvider',
    internalDoc.uri,
    new vscode.Position(0, 5),
  );
  assert.ok(
    hoverText(internalHover).includes('Valor observado'),
    'Uncurated ConVar still has technical hover',
  );
  await internalSettings.update('completionMode', 'normal', vscode.ConfigurationTarget.Global);
  await new Promise((resolve) => setTimeout(resolve, 350));
  assert.ok(
    !vscode.languages.getDiagnostics(internalDoc.uri).some((d) => d.code === 'unknown'),
    'Filtering suggestions does not hide symbol recognition',
  );
  const portuguese = await vscode.commands.executeCommand(
    'vscode.executeHoverProvider',
    doc.uri,
    new vscode.Position(4, 5),
  );
  assert.ok(
    hoverText(portuguese).includes('Configuração histórica'),
    'Portuguese hover changes without reload',
  );
  assert.ok(
    !hoverText(portuguese).includes('Build e funcionamento ainda não verificados'),
    'No repeated generic disclaimer',
  );
  const parameterDocument = await vscode.workspace.openTextDocument({
    language: 'cs2cfg',
    content: 'cl_hud_color "2"\nviewmodel_offset_x "1"\ncl_hud_color ',
  });
  await vscode.workspace
    .getConfiguration('cs2Config', parameterDocument.uri)
    .update('descriptionLanguage', 'pt-BR', vscode.ConfigurationTarget.Global);
  const colors = await vscode.commands.executeCommand(
    'vscode.executeHoverProvider',
    parameterDocument.uri,
    new vscode.Position(0, 14),
  );
  assert.ok(hoverText(colors).includes('Branco intenso'), 'Parameter hover explains color');
  assert.ok(
    hoverText(colors).includes('Valor') && hoverText(colors).includes('2025-05-19'),
    'Value table and source date',
  );
  assert.ok(
    !hoverText(colors).includes('not guaranteed') && !hoverText(colors).includes('Observed corpus'),
    'Concise examples',
  );
  const colorCompletion = await vscode.commands.executeCommand(
    'vscode.executeCompletionItemProvider',
    parameterDocument.uri,
    new vscode.Position(2, 13),
  );
  assert.equal(colorCompletion.items.find((item) => item.label === '2')?.detail, 'Branco intenso');
  assert.ok(
    colorCompletion.items.some((item) => item.label === '12'),
    'Documented values beyond the fixture',
  );
  const crosshairDoc = await vscode.workspace.openTextDocument({
    language: 'cs2cfg',
    content: 'cl_crosshair_length "8"\ncl_crosshairsize "2"\ncl_crosshairstyle ',
  });
  const crosshairHover = await vscode.commands.executeCommand(
    'vscode.executeHoverProvider',
    crosshairDoc.uri,
    new vscode.Position(0, 5),
  );
  assert.ok(hoverText(crosshairHover).includes('255'), 'Current range in hover');
  assert.ok(
    hoverText(crosshairHover).includes('Valor atual') &&
      hoverText(crosshairHover).includes('Intervalo permitido'),
    'Structured usage fields',
  );
  assert.ok(
    !hoverText(crosshairHover).includes('ConVar') &&
      !hoverText(crosshairHover).includes('Snapshot value'),
    'Standard hover hides pipeline/type wording',
  );
  const hoverSettings = vscode.workspace.getConfiguration('cs2Config', crosshairDoc.uri);
  await hoverSettings.update('hoverDetails', 'advanced', vscode.ConfigurationTarget.Global);
  const advancedHover = await vscode.commands.executeCommand(
    'vscode.executeHoverProvider',
    crosshairDoc.uri,
    new vscode.Position(0, 5),
  );
  assert.ok(
    hoverText(advancedHover).includes('Proveniência por campo') &&
      hoverText(advancedHover).includes('ConVar'),
    'Advanced hover exposes technical evidence',
  );
  await hoverSettings.update('hoverDetails', 'standard', vscode.ConfigurationTarget.Global);
  const styles = await vscode.commands.executeCommand(
    'vscode.executeCompletionItemProvider',
    crosshairDoc.uri,
    new vscode.Position(2, 18),
  );
  assert.ok(
    styles.items.some((item) => item.label === '9'),
    'Current styles in completion',
  );
  await new Promise((resolve) => setTimeout(resolve, 400));
  const hidden = vscode.languages
    .getDiagnostics(crosshairDoc.uri)
    .find((diagnostic) => diagnostic.code === 'hidden-compatibility');
  assert.ok(
    hidden && hidden.severity === vscode.DiagnosticSeverity.Information,
    'Hidden compatibility is informational',
  );
  const definitions = await vscode.commands.executeCommand(
    'vscode.executeDefinitionProvider',
    doc.uri,
    new vscode.Position(1, 2),
  );
  assert.ok(definitions.length, 'Alias definition');
  const links = await vscode.commands.executeCommand('vscode.executeLinkProvider', doc.uri);
  assert.ok(
    links.some((link) => link.target?.fsPath === path.join(directory, 'practice.cfg')),
    'Exec target resolves',
  );
  await new Promise((resolve) => setTimeout(resolve, 600));
  assert.ok(
    vscode.languages.getDiagnostics(doc.uri).some((d) => d.code === 'reported-rejection'),
    'Opt-in rejection diagnostic',
  );
  for (const name of ['autoexec.cfg', 'practice.cfg']) {
    const corpus = await vscode.workspace.openTextDocument(
      vscode.Uri.file(path.join(root, 'tests/fixtures', name)),
    );
    await vscode.languages.setTextDocumentLanguage(corpus, 'cs2cfg');
    await new Promise((resolve) => setTimeout(resolve, 300));
    assert.ok(
      !vscode.languages
        .getDiagnostics(corpus.uri)
        .some(
          (d) =>
            (d.code === 'unknown' && corpus.getText(d.range) !== '+showscores') ||
            d.severity === vscode.DiagnosticSeverity.Error,
        ),
      `${name} coverage`,
    );
  }
  const formatDocument = await vscode.workspace.openTextDocument({
    language: 'cs2cfg',
    content: '  rate    "1"\n\n\n\n bind   "F2"  "bot_add_t; echo  hi"\n',
  });
  const formattingOptions = { tabSize: 2, insertSpaces: true };
  const edits = await vscode.commands.executeCommand(
    'vscode.executeFormatDocumentProvider',
    formatDocument.uri,
    formattingOptions,
  );
  assert.ok(edits.length, 'Document formatting is registered');
  // VS Code can minimize a provider's full-document replacement into several edits.
  function applyEdits(document, edits) {
    let text = document.getText();
    for (const edit of [...edits].sort(
      (left, right) => document.offsetAt(right.range.start) - document.offsetAt(left.range.start),
    )) {
      text =
        text.slice(0, document.offsetAt(edit.range.start)) +
        edit.newText +
        text.slice(document.offsetAt(edit.range.end));
    }
    return text;
  }
  assert.equal(
    applyEdits(formatDocument, edits).replace(/\r\n/g, '\n'),
    'rate "1"\n\nbind "F2" "bot_add_t; echo  hi"\n',
  );
  const selectionEdits = await vscode.commands.executeCommand(
    'vscode.executeFormatRangeProvider',
    formatDocument.uri,
    new vscode.Range(0, 3, 0, 7),
    formattingOptions,
  );
  assert.equal(
    applyEdits(formatDocument, selectionEdits),
    formatDocument.getText().replace('  rate    "1"', 'rate "1"'),
  );
  assert.ok(
    selectionEdits.every((edit) => edit.range.start.line === 0 && edit.range.end.line === 0),
  );
  const analysisDoc = await vscode.workspace.openTextDocument({
    language: 'cs2cfg',
    content:
      'cl_hud_color 99\ncl_hud_color 2\nbot_ad_t\nalias loop "loop"\nloop\nalias local "echo hello"\nlocal\n',
  });
  await new Promise((resolve) => setTimeout(resolve, 500));
  const findings = vscode.languages.getDiagnostics(analysisDoc.uri);
  assert.ok(
    findings.some((f) => f.code === 'parameter-value'),
    'Invalid enum value warning',
  );
  assert.ok(
    findings.some((f) => f.code === 'alias-cycle'),
    'Alias cycle warning',
  );
  const typo = findings.find(
    (f) => f.code === 'unknown' && analysisDoc.getText(f.range) === 'bot_ad_t',
  );
  assert.ok(typo);
  const fixes = await vscode.commands.executeCommand(
    'vscode.executeCodeActionProvider',
    analysisDoc.uri,
    typo.range,
  );
  const fix = fixes.find((f) =>
    f.edit?.entries().some(([, edits]) => edits.some((edit) => edit.newText === 'bot_add_t')),
  );
  assert.ok(fix, 'Known-name quick fix');
  assert.ok(await vscode.workspace.applyEdit(fix.edit));
  assert.equal(analysisDoc.lineAt(2).text, 'bot_add_t', 'Only requested token replaced');
  const symbols = await vscode.commands.executeCommand(
    'vscode.executeDocumentSymbolProvider',
    analysisDoc.uri,
  );
  assert.ok(
    symbols.some((symbol) => symbol.name === 'local'),
    'Alias in outline',
  );
  const references = await vscode.commands.executeCommand(
    'vscode.executeReferenceProvider',
    analysisDoc.uri,
    new vscode.Position(6, 2),
  );
  assert.ok(
    references.some((location) => location.range.start.line === 6),
    'Local alias reference',
  );
  const analysisSettings = vscode.workspace.getConfiguration('cs2Config', analysisDoc.uri);
  await analysisSettings.update('inlayHints', true, vscode.ConfigurationTarget.Global);
  const inlays = await vscode.commands.executeCommand(
    'vscode.executeInlayHintProvider',
    analysisDoc.uri,
    new vscode.Range(0, 0, analysisDoc.lineCount - 1, 0),
  );
  assert.ok(
    inlays.some((hint) => hint.label === 'Branco intenso'),
    'Optional translated parameter meaning',
  );
  await analysisSettings.update('inlayHints', false, vscode.ConfigurationTarget.Global);
  await analysisSettings.update('parameterValidation', false, vscode.ConfigurationTarget.Global);
  await new Promise((resolve) => setTimeout(resolve, 350));
  assert.ok(
    !vscode.languages.getDiagnostics(analysisDoc.uri).some((f) => f.code === 'parameter-value'),
    'Validation configurable',
  );
  await analysisSettings.update('parameterValidation', true, vscode.ConfigurationTarget.Global);
  await vscode.window.showTextDocument(analysisDoc);
  const health = await vscode.commands.executeCommand('cs2Config.healthCheck');
  assert.ok(health.findings > 0 && health.partial, 'Health command shares single-file analysis');
  const bindDoc = await vscode.workspace.openTextDocument({
    language: 'cs2cfg',
    content: 'bind q "slot1"\nbind q "slot2"\nbind q "slot2"',
  });
  const bindSettings = vscode.workspace.getConfiguration('cs2Config', bindDoc.uri);
  await bindSettings.update('bindDiagnostics', 'information', vscode.ConfigurationTarget.Global);
  await vscode.window.showTextDocument(bindDoc);
  const initialBindHealth = await vscode.commands.executeCommand('cs2Config.healthCheck');
  const originalBindText = bindDoc.getText();
  const map = await vscode.commands.executeCommand('cs2Config.bindMap');
  assert.equal(
    map.entries,
    initialBindHealth.counts.binds,
    'Visual map uses the same modeled binds',
  );
  assert.equal(map.partial, initialBindHealth.partial, 'Visual map preserves shared uncertainty');
  assert.equal(bindDoc.getText(), originalBindText, 'Read-only map leaves the CFG intact');
  await vscode.commands.executeCommand('workbench.action.closeActiveEditor');
  await new Promise((resolve) => setTimeout(resolve, 400));
  const bindDiagnostics = vscode.languages
    .getDiagnostics(bindDoc.uri)
    .filter((d) => String(d.code).startsWith('bind-'));
  assert.deepEqual(
    bindDiagnostics.map((d) => d.code),
    ['bind-overwritten', 'bind-redundant'],
  );
  assert.ok(bindDiagnostics.every((d) => d.severity === vscode.DiagnosticSeverity.Information));
  assert.equal(
    bindDiagnostics[0].relatedInformation[0].location.range.start.line,
    0,
    'Previous binding link',
  );
  const bindActions = await vscode.commands.executeCommand(
    'vscode.executeCodeActionProvider',
    bindDoc.uri,
    bindDiagnostics[0].range,
  );
  assert.ok(
    !bindActions.some((action) => action.edit),
    'Conflicts are not automatically cleaned up',
  );
  await bindSettings.update('bindDiagnostics', 'off', vscode.ConfigurationTarget.Global);
  await new Promise((resolve) => setTimeout(resolve, 350));
  assert.ok(
    !vscode.languages.getDiagnostics(bindDoc.uri).some((d) => String(d.code).startsWith('bind-')),
  );
  await vscode.window.showTextDocument(bindDoc);
  const bindHealth = await vscode.commands.executeCommand('cs2Config.healthCheck');
  assert.equal(
    bindHealth.counts.bindOverwrites,
    1,
    'Health includes conflicts even with editor notices off',
  );
  assert.equal(bindHealth.counts.redundantBinds, 1);
  await bindSettings.update('bindDiagnostics', 'warning', vscode.ConfigurationTarget.Global);
  await new Promise((resolve) => setTimeout(resolve, 350));
  assert.ok(
    vscode.languages
      .getDiagnostics(bindDoc.uri)
      .filter((d) => String(d.code).startsWith('bind-'))
      .every((d) => d.severity === vscode.DiagnosticSeverity.Warning),
  );
  await bindSettings.update('bindDiagnostics', 'information', vscode.ConfigurationTarget.Global);
  // Folder access is exercised against synthetic files, never the game installation.
  const { ConfigFolder } = require(path.join(extension.extensionPath, 'dist/vscode/config-folder'));
  const { createServices } = require(path.join(extension.extensionPath, 'dist/vscode/services'));
  const stored = new Map();
  const memory = {
    get: (key) => stored.get(key),
    update: async (key, value) =>
      value === undefined ? stored.delete(key) : stored.set(key, value),
  };
  const subscriptions = [];
  const folderServices = createServices({ extensionPath: extension.extensionPath, subscriptions });
  const configFolder = new ConfigFolder(memory, folderServices);
  const temporary = fs.mkdtempSync(path.join(directory, 'hub-'));
  const synthetic = path.join(temporary, 'autoexec.cfg');
  fs.writeFileSync(synthetic, 'bind q slot1\nexec missing\n');
  fs.writeFileSync(path.join(temporary, 'notes.txt'), 'not a CFG');
  const nested = path.join(temporary, 'nested');
  fs.mkdirSync(nested);
  fs.writeFileSync(path.join(nested, 'hidden.cfg'), 'bind q slot2');
  try {
    await configFolder.connect(temporary);
    assert.equal(configFolder.snapshot.connected, true);
    assert.deepEqual(
      configFolder.snapshot.files.map((file) => file.name),
      ['autoexec.cfg'],
    );
    assert.equal(configFolder.snapshot.files[0].summary.binds, 1);
    assert.equal(configFolder.snapshot.files[0].summary.partial, true);
    const original = fs.readFileSync(synthetic, 'utf8');
    await assert.rejects(configFolder.createEmpty('autoexec.cfg', configFolder.snapshot.folder));
    assert.equal(
      fs.readFileSync(synthetic, 'utf8'),
      original,
      'Exclusive creation preserves existing CFG',
    );
    await assert.rejects(configFolder.createEmpty('../outside.cfg', configFolder.snapshot.folder));
    const openHubDoc = await vscode.workspace.openTextDocument(vscode.Uri.file(synthetic));
    const edit = new vscode.WorkspaceEdit();
    edit.insert(openHubDoc.uri, new vscode.Position(0, 0), 'bind w slot2\n');
    assert.ok(await vscode.workspace.applyEdit(edit));
    await configFolder.refresh();
    assert.equal(configFolder.snapshot.files[0].summary.binds, 2, 'Hub includes unsaved text');
    assert.equal(
      fs.readFileSync(synthetic, 'utf8'),
      original,
      'Analysis never writes unsaved text',
    );
    const newCfg = await configFolder.createEmpty('new.cfg', configFolder.snapshot.folder);
    assert.equal(fs.readFileSync(newCfg.fsPath, 'utf8'), '');
    assert.equal(configFolder.snapshot.files.length, 2);
    const restored = new ConfigFolder(memory, folderServices);
    await restored.restore();
    assert.equal(restored.snapshot.folder, configFolder.snapshot.folder);
    restored.dispose();
    await configFolder.disconnect();
    assert.equal(configFolder.snapshot.files.length, 0);
    assert.equal(stored.size, 0);
    const home = await vscode.commands.executeCommand('cs2Config.home');
    assert.ok(home && Array.isArray(home.files), 'Home command opens a functional WebView');
    await vscode.commands.executeCommand('workbench.action.closeActiveEditor');
  } finally {
    configFolder.dispose();
    subscriptions.forEach((subscription) => subscription.dispose());
    // Only known synthetic files created by this test are removed.
    for (const name of ['autoexec.cfg', 'notes.txt', 'new.cfg']) {
      const target = path.join(temporary, name);
      if (fs.existsSync(target)) fs.unlinkSync(target);
    }
    fs.unlinkSync(path.join(nested, 'hidden.cfg'));
    fs.rmdirSync(nested);
    fs.rmdirSync(temporary);
  }
  console.log(
    'PASS: Extension Host integration: completion, bilingual hover, definitions, links, diagnostics, CFG coverage, formatting, config hub, folder persistence, unsaved analysis and exclusive creation.',
  );
};
