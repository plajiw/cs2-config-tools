import * as vscode from 'vscode';
import { createServices, Services, ui } from './vscode/services';
import { registerDiagnostics } from './vscode/diagnostics';
import { registerProviders } from './vscode/providers';
import { registerFormatting } from './vscode/formatting';
import { registerNavigation } from './vscode/navigation';
import { registerInlays } from './vscode/inlays';
import { registerHealth } from './vscode/health';
import { registerBindMap } from './vscode/bind-map';
import { registerConfigHub } from './vscode/config-hub';

export function activate(context: vscode.ExtensionContext): void {
  let services: Services;
  try {
    services = createServices(context);
  } catch (error) {
    console.error('CS2 Config Tools catalog startup failure:', error);
    void vscode.window.showErrorMessage(
      ui(
        'CS2 Config Tools could not load its command catalog. Reinstall the extension, or rebuild the catalog and extension in a development checkout. Analysis is unavailable.',
        'CS2 Config Tools não conseguiu carregar o catálogo de comandos. Reinstale a extensão ou reconstrua o catálogo e a extensão em um checkout de desenvolvimento. A análise está indisponível.',
      ),
    );
    return;
  }
  registerDiagnostics(services, context);
  registerProviders(services, context);
  registerFormatting(context);
  registerNavigation(services, context);
  registerInlays(services, context);
  registerHealth(services, context);
  registerBindMap(services, context);
  registerConfigHub(services, context);
}
