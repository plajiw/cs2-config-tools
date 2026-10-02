const vscode = require('vscode');
const fs = require('node:fs');
const path = require('node:path');
exports.run = async () => {
  const output = process.env.CS2_BIND_VISUAL_OUTPUT;
  if (!output) throw new Error('Use capture-main-screens-host.cjs');
  const root = path.resolve(__dirname, '../..');
  const manifest = require(path.join(root, 'package.json'));
  await vscode.extensions.getExtension(`${manifest.publisher}.${manifest.name}`).activate();
  await vscode.workspace
    .getConfiguration('workbench')
    .update(
      'colorTheme',
      process.env.CS2_BIND_VISUAL_THEME || 'Default Dark Modern',
      vscode.ConfigurationTarget.Global,
    );
  const { hubPage, videoPage } = require(path.join(root, 'dist/vscode/config-hub'));
  const { parse } = require(path.join(root, 'dist/core/parser'));
  const { CommandRegistry } = require(path.join(root, 'dist/catalog/registry'));
  const { configSummary } = require(path.join(root, 'dist/core/config-workspace'));
  const { parseVideoSettings, videoRows } = require(path.join(root, 'dist/core/video-settings'));
  const registry = new CommandRegistry(require(path.join(root, 'catalog/catalog.json')));
  const video = parseVideoSettings(
    '"video.cfg" { "setting.defaultres" "1920" "setting.defaultresheight" "1080" "setting.refreshrate_numerator" "144000" "setting.refreshrate_denominator" "1000" "setting.fullscreen" "1" "setting.mat_vsync" "0" "setting.msaa_samples" "4" "VendorID" "4318" "unknown.future.key" "unverified literal" }',
  );
  const summary = configSummary(
    parse(fs.readFileSync(path.join(output, 'visual.cfg'), 'utf8')),
    registry,
  );
  const isVideo = process.env.CS2_MAIN_SCREEN === 'video';
  const state = isVideo
    ? {
        type: 'videoState',
        connected: true,
        status: 'available',
        pt: false,
        video,
        rows: videoRows(video, false),
      }
    : {
        type: 'state',
        revision: 1,
        connected: true,
        writable: true,
        folder: output,
        typical: false,
        limited: false,
        pt: false,
        files: [
          { name: 'autoexec.cfg', summary },
          { name: 'practice-team-weekend.cfg', summary },
        ],
        userdata: {
          connected: true,
          folder: path.join(output, 'synthetic-userdata'),
          profileId: 'synthetic',
          status: 'available',
          video,
        },
      };
  const panel = vscode.window.createWebviewPanel(
    'cs2Config.visualAcceptance',
    isVideo ? 'Video Settings' : 'Configuration Hub',
    vscode.ViewColumn.Active,
    { enableScripts: true, localResourceRoots: [vscode.Uri.file(path.join(root, 'resources'))] },
  );
  panel.webview.onDidReceiveMessage((message) => {
    if (message.type === 'ready') void panel.webview.postMessage(state);
  });
  panel.webview.html = (isVideo ? videoPage : hubPage)(panel.webview, vscode.Uri.file(root));
  await vscode.commands.executeCommand('notifications.clearAll');
  fs.writeFileSync(path.join(output, 'ready'), 'ready');
  const deadline = Date.now() + 180000;
  while (!fs.existsSync(path.join(output, 'done'))) {
    if (Date.now() > deadline) throw Error('Visual host deadline');
    await new Promise((r) => setTimeout(r, 200));
  }
  panel.dispose();
};
