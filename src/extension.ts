import * as vscode from 'vscode';
import { createServices } from './vscode/services';
import { registerDiagnostics } from './vscode/diagnostics';
import { registerProviders } from './vscode/providers';
import { registerFormatting } from './vscode/formatting';
import { registerNavigation } from './vscode/navigation';
import { registerInlays } from './vscode/inlays';
import { registerHealth } from './vscode/health';
import { registerBindMap } from './vscode/bind-map';

export function activate(context: vscode.ExtensionContext): void {
  const services = createServices(context);
  registerDiagnostics(services, context);
  registerProviders(services, context);
  registerFormatting(context);
  registerNavigation(services, context);
  registerInlays(services, context);
  registerHealth(services, context);
  registerBindMap(services, context);
}
