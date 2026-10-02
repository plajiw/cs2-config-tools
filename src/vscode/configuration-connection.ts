import * as vscode from 'vscode';
import { promises as fs } from 'node:fs';
import { ConfigFolder, detectConfigFolders } from './config-folder';
import { SteamUserdata, detectUserdataFolders } from './steam-userdata';

/** One discovery/consent flow; each source retains its existing persistence and reader. */
export async function connectConfiguration(
  folder: Pick<ConfigFolder, 'snapshot' | 'connect'>,
  userdata: Pick<SteamUserdata, 'snapshot' | 'connect'>,
  pt: boolean,
  discover = { cfg: detectConfigFolders, userdata: detectUserdataFolders },
): Promise<void> {
  const label = (en: string, br: string) => (pt ? br : en);
  const [cfgs, profiles] = await Promise.all([discover.cfg(), discover.userdata()]);
  async function select(candidates: string[], current: string | undefined, profile: boolean) {
    const paths: string[] = [];
    for (const candidate of new Set([...(current ? [current] : []), ...candidates])) {
      try {
        if ((await fs.stat(candidate)).isDirectory()) paths.push(candidate);
      } catch {
        /* Missing previous sources can be selected manually again. */
      }
    }
    let selected: string | undefined;
    if (paths.length === 1) selected = paths[0];
    else {
      const picked = await vscode.window.showQuickPick(
        [
          ...paths.map((folder) => ({
            label: profile
              ? label('Steam profile ', 'Perfil Steam ') +
                (folder.match(/[\\/]userdata[\\/](\d+)[\\/]730/i)?.[1] ??
                  label('custom', 'personalizado'))
              : label('CS2 CFG folder', 'Pasta de CFGs do CS2'),
            description: folder,
            folder,
          })),
          {
            label: label('Choose folder manually…', 'Escolher pasta manualmente…'),
            folder: 'manual',
          },
          ...(profile
            ? [
                {
                  label: label('Continue with CFGs only', 'Continuar somente com CFGs'),
                  folder: 'skip',
                },
              ]
            : []),
        ],
        {
          title: profile
            ? label('Connect configuration · Steam profile', 'Conectar configuração · perfil Steam')
            : label('Connect configuration · game folder', 'Conectar configuração · pasta do jogo'),
        },
      );
      if (!picked) return undefined;
      if (picked.folder === 'skip') return '';
      if (picked.folder !== 'manual') selected = picked.folder;
      else {
        const uri = (
          await vscode.window.showOpenDialog({
            canSelectFiles: false,
            canSelectFolders: true,
            canSelectMany: false,
            title: profile
              ? label('Select Steam 730/local/cfg', 'Selecione Steam 730/local/cfg')
              : label('Select CS2 CFG folder', 'Selecione a pasta de CFGs do CS2'),
          })
        )?.[0];
        if (uri?.scheme === 'file') selected = uri.fsPath;
      }
    }
    if (!selected) return undefined;
    const canonical = await fs.realpath(selected);
    if (!(await fs.stat(canonical)).isDirectory()) throw new Error('Not a directory');
    return canonical;
  }
  const cfg = await select(cfgs, folder.snapshot.folder, false);
  if (cfg === undefined) return;
  const profile = await select(profiles, userdata.snapshot.folder, true);
  if (profile === undefined) return;
  const allow = label('Connect configuration', 'Conectar configuração');
  const approved = await vscode.window.showInformationMessage(
    allow + '?',
    {
      modal: true,
      detail:
        label('CFG folder: ', 'Pasta de CFGs: ') +
        cfg +
        '\n\n' +
        label('Steam profile folder: ', 'Pasta do perfil Steam: ') +
        (profile || label('Not selected', 'Não selecionada')) +
        '\n\n' +
        label(
          'Allow reading these folders to inspect CFGs and saved game settings. Creating or removing a CFG requires a separate confirmation. No automatic file changes or game commands. This is a local connection, without a Steam login.',
          'Permitir a leitura destas pastas para inspecionar CFGs e configurações salvas. Criar ou remover uma CFG exige confirmação separada. Sem alterações automáticas nem comandos no jogo. Esta é uma conexão local, sem login na Steam.',
        ),
    },
    allow,
  );
  if (approved !== allow) return;
  await folder.connect(cfg);
  if (profile) await userdata.connect(profile);
}
