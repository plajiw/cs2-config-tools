/* Presentation only: folder access and CFG semantics stay in the extension host. */
(() => {
  'use strict';
  const vscode = acquireVsCodeApi();
  let state;
  let sourceSignature;
  const $ = (id) => document.getElementById(id);
  const node = (tag, text, className) => {
    const element = document.createElement(tag);
    if (text !== undefined) element.textContent = text;
    if (className) element.className = className;
    return element;
  };
  const shapes = {
    keyboard: 'M3 5h18v14H3z M6 9h1m3 0h1m3 0h1m3 0h1M6 12h1m3 0h1m3 0h1m3 0h1M7 16h10',
    file: 'M5 2h9l5 5v15H5z M14 2v6h5M8 12h8m-8 4h8',
    target: 'M12 3a9 9 0 1 0 9 9M12 7a5 5 0 1 0 5 5M12 12l9-9m-5 0h5v5',
    terminal: 'M3 4h18v16H3z M7 9l3 3-3 3m6 0h4',
    search: 'M16 16l5 5M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0',
    pulse: 'M2 12h5l3-8 4 16 3-8h5',
  };
  function icon(name) {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('aria-hidden', 'true');
    const path = document.createElementNS(svg.namespaceURI, 'path');
    path.setAttribute('d', shapes[name] || shapes.file);
    svg.append(path);
    return svg;
  }
  function button(text, action, file, className) {
    const element = node('button', text, className);
    element.type = 'button';
    element.dataset.action = action;
    if (file) element.dataset.file = file;
    element.disabled =
      !state.connected &&
      ![
        'connect',
        'choose',
        'detect',
        'refresh',
        'detectSettings',
        'connectSettings',
        'explorer',
      ].includes(action);
    return element;
  }
  function render(next) {
    state = next;
    const t = (en, br) => (state.pt ? br : en);
    document.documentElement.lang = state.pt ? 'pt-BR' : 'en';
    const focused = document.activeElement;
    const identity = focused?.dataset.action
      ? [focused.dataset.action, focused.dataset.file ?? '', focused.closest('[id]')?.id]
      : undefined;
    const labels = {
      tagline: t(
        'Manage, inspect and organize your Counter-Strike 2 configuration files.',
        'Organize e explore seus arquivos de configuração do Counter-Strike 2.',
      ),
      'connect-sources': t('Connect configuration', 'Conectar configuração'),
      'welcome-title': t('Connect your configuration', 'Conecte sua configuração'),
      'welcome-copy': t(
        'Find your CS2 folder and Steam profile in one flow, then approve the selected folders.',
        'Encontre a pasta do CS2 e seu perfil Steam em um único fluxo e aprove as pastas selecionadas.',
      ),
      detect: t('Connect configuration', 'Conectar configuração'),
      choose: t('Choose folder', 'Escolher pasta'),
      'sources-title': t('Configuration Sources', 'Fontes de configuração'),
      'settings-title': t('Saved Game Settings', 'Configurações salvas do jogo'),
      'userdata-title': t('Steam userdata', 'Steam userdata'),
      'connect-settings': t('Choose folder manually', 'Escolher pasta manualmente'),
      'detect-settings': t('Detect Steam profiles', 'Detectar perfis Steam'),
      'disconnect-settings': t('Disconnect Game Settings', 'Desconectar configurações'),
      'scope-title': t('Analysis scope', 'Escopo da análise'),
      'open-settings-folder': t('Open folder', 'Abrir pasta'),
      'folder-title': t('CS2 Config Folder', 'Pasta de CFGs do CS2'),
      change: t('Change folder', 'Trocar pasta'),
      reveal: t('Open in Explorer', 'Abrir no explorador'),
      refresh: t('Refresh', 'Atualizar'),
      disconnect: t('Disconnect', 'Desconectar'),
      'access-title': t('Folder access', 'Acesso à pasta'),
      'access-copy': t(
        'Files are read after your permission. Existing configs open in the text editor. No automatic writes or command execution.',
        'Arquivos são lidos após sua permissão. CFGs existentes abrem no editor de texto. Sem escrita automática ou execução de comandos.',
      ),
      'overview-title': t('CFG Overview', 'Resumo das CFGs'),
      'overview-copy': t(
        'CFG files only; saved game settings are shown below.',
        'Somente arquivos CFG; configurações salvas pelo jogo aparecem abaixo.',
      ),
      'quick-title': t('Quick Actions', 'Ações rápidas'),
      'quick-copy': t(
        'Start with a file or create an empty CFG.',
        'Abra um arquivo ou crie uma CFG vazia.',
      ),
      'files-title': t('Your CFGs', 'Suas CFGs'),
      'files-note': t(
        'Current folder · unsaved editor text is included in analysis.',
        'Pasta atual · a análise inclui alterações não salvas no editor.',
      ),
      new: t('+ New CFG', '+ Nova CFG'),
      scope: t(
        'Static analysis only. Counts are summed per file, not the running game state. External execs remain unresolved. File grouping uses name hints, not proven ownership.',
        'Somente análise estática. Contagens são somadas por arquivo e não representam o jogo em execução. Execs externos permanecem não resolvidos. O agrupamento usa nomes, sem comprovar autoria.',
      ),
    };
    for (const [id, text] of Object.entries(labels)) $(id).textContent = text;
    $('connection').textContent =
      state.connected && state.userdata?.connected && state.userdata.status === 'available'
        ? t('Ready', 'Pronto')
        : state.connected
          ? t('CFG connected', 'CFG conectada')
          : state.userdata?.connected
            ? t('Game settings connected', 'Configurações salvas conectadas')
            : t('Set up sources', 'Conectar fontes');
    $('connection').classList.toggle('connected', state.connected);
    $('welcome').hidden = state.connected;
    $('folder-path').textContent =
      state.folder || t('No folder selected', 'Nenhuma pasta selecionada');
    $('folder-note').textContent =
      state.folder && !state.connected
        ? t(
            'Folder unavailable. Check permissions or choose another folder.',
            'Pasta indisponível. Confira as permissões ou escolha outra pasta.',
          )
        : state.connected && !state.typical
          ? t('Custom CFG folder', 'Pasta personalizada de CFGs')
          : t('Typical location: game/csgo/cfg', 'Local habitual: game/csgo/cfg');
    for (const id of ['reveal', 'new']) $(id).disabled = !state.connected;
    $('disconnect').disabled = !state.folder;
    $('userdata-path').textContent = state.userdata?.folder || t('Not connected', 'Não conectado');
    $('disconnect-settings').hidden = !state.userdata?.folder;
    $('open-settings-folder').hidden = !state.userdata?.connected;
    $('open-settings-folder').disabled = !state.userdata?.connected;
    $('connect-settings').hidden = !!state.userdata?.connected;
    $('detect-settings').textContent = state.userdata?.connected
      ? t('Change connection', 'Trocar conexão')
      : t('Connect configuration', 'Conectar configuração');
    $('disconnect').hidden = !state.folder;
    $('userdata-status').textContent =
      (state.userdata?.connected
        ? t('● Connected', '● Conectado')
        : t('○ Not connected', '○ Não conectado')) +
      (state.userdata?.profileId
        ? ' · ' + t('Profile ', 'Perfil ') + state.userdata.profileId
        : '') +
      ' · ' +
      t('Read-only connection', 'Conexão somente leitura');
    const signature = [state.connected, state.userdata?.connected, state.userdata?.status].join(
      ':',
    );
    if (signature !== sourceSignature) {
      $('sources').open =
        !state.connected ||
        !state.userdata?.connected ||
        ['missing', 'invalid', 'unavailable'].includes(state.userdata?.status);
      sourceSignature = signature;
    }

    const firstFile =
      state.files.find((file) => file.name.toLowerCase() === 'autoexec.cfg')?.name ||
      state.files.find((file) => file.origin !== 'game')?.name;
    renderGameSettings(t);
    renderOverview(t);
    renderQuickActions(t, firstFile);
    renderFiles(t);
    if (identity && !focused.isConnected) {
      const region = document.getElementById(identity[2]) || document;
      const replacement = [...region.querySelectorAll('button[data-action]')].find(
        (element) =>
          element.dataset.action === identity[0] && (element.dataset.file ?? '') === identity[1],
      );
      if (replacement && !replacement.disabled && !replacement.hidden)
        replacement.focus({ preventScroll: true });
    }
  }
  function renderOverview(t) {
    const summaries = state.files
      .filter((file) => file.origin !== 'game' && file.summary)
      .map((file) => file.summary);
    $('stats').replaceChildren();
    const totals = [
      state.files.filter((file) => file.origin !== 'game').length,
      ...['binds', 'settings', 'aliases'].map((key) =>
        summaries.reduce((sum, summary) => sum + summary[key], 0),
      ),
    ];
    const statLabels = [
      t('CFG files', 'Arquivos CFG'),
      'Binds',
      t('Settings', 'Configurações'),
      'Aliases',
    ];
    totals.forEach((value, index) => {
      const stat = node('div', undefined, `stat stat-${index}`);
      stat.append(
        icon(['file', 'keyboard', 'target', 'terminal'][index]),
        node('strong', String(value)),
        node('span', statLabels[index]),
      );
      $('stats').append(stat);
    });
  }
  function renderQuickActions(t, firstFile) {
    $('quick').replaceChildren();
    if (firstFile) {
      for (const [title, action] of [
        [t('Open', 'Abrir'), 'open'],
        [t('View Bind Map', 'Ver mapa de binds'), 'bindMap'],
        [t('Health Check', 'Verificar CFG'), 'health'],
      ])
        $('quick').append(button(`${title} · ${firstFile}`, action, firstFile));
    }
    $('quick').append(button(t('Create CFG', 'Criar CFG'), 'new'));
    $('quick').append(button(t('Command Explorer', 'Explorador de comandos'), 'explorer'));
  }
  function renderFiles(t) {
    const summaries = state.files
      .filter((file) => file.origin !== 'game' && file.summary)
      .map((file) => file.summary);
    $('table-head').replaceChildren();
    const head = node('tr');
    for (const text of [
      t('File', 'Arquivo'),
      'Binds',
      t('Findings', 'Achados'),
      t('Analysis', 'Análise'),
      t('Actions', 'Ações'),
    ]) {
      const th = node('th', text);
      th.scope = 'col';
      head.append(th);
    }
    $('table-head').append(head);
    $('files').replaceChildren();
    $('other-files').replaceChildren();
    const gameCount = state.files.filter((file) => file.origin === 'game').length;
    $('other-configs').hidden = !gameCount;
    $('other-title').textContent = t('Other CS2 CFGs', 'Outras CFGs do CS2') + ' · ' + gameCount;
    for (const file of state.files) {
      const row = node('tr');
      const name = node('td');
      name.append(button(file.name, 'open', file.name, 'file-link'));
      const status =
        file.summary && (file.summary.errors || file.summary.warnings)
          ? t('Needs review', 'Precisa de revisão')
          : file.summary
            ? file.summary.partial
              ? t('Partial analysis', 'Análise parcial')
              : t('Checked', 'Analisado')
            : t('Needs review', 'Precisa de revisão');
      row.append(
        name,
        node('td', String(file.summary?.binds ?? '—')),
        node(
          'td',
          file.summary
            ? [
                file.summary.errors ? file.summary.errors + ' ' + t('errors', 'erros') : '',
                file.summary.warnings ? file.summary.warnings + ' ' + t('warnings', 'avisos') : '',
                file.summary.information
                  ? file.summary.information + ' ' + t('notes', 'observações')
                  : '',
              ]
                .filter(Boolean)
                .join(' · ') || t('No findings', 'Sem achados')
            : '—',
        ),
        node('td', status),
      );
      const actions = node('td', undefined, 'row-actions');
      actions.append(
        button(t('Bind Map', 'Mapa de binds'), 'bindMap', file.name),
        button(t('Inspect', 'Verificar'), 'health', file.name),
      );
      const remove = button(t('Remove CFG', 'Remover CFG'), 'delete', file.name);
      remove.disabled = !state.writable;
      actions.append(remove);
      row.append(actions);
      $(file.origin === 'game' ? 'other-files' : 'files').append(row);
    }
    $('empty').textContent = !state.files.length
      ? t('No CFG files to display.', 'Nenhum arquivo CFG para exibir.')
      : state.limited
        ? t(
            'Showing the first 100 files. Folder totals are limited to this list.',
            'Exibindo os primeiros 100 arquivos. Os totais estão limitados a esta lista.',
          )
        : summaries.length < state.files.filter((file) => file.origin !== 'game').length
          ? t(
              'Some files could not be analyzed or exceeded the size limit; their counts are excluded.',
              'Alguns arquivos não puderam ser analisados ou excederam o limite de tamanho; suas contagens não foram incluídas.',
            )
          : '';
  }
  function renderGameSettings(t) {
    const settings = state.userdata;
    const messages = {
      disconnected: t(
        'Connect a Steam profile to inspect saved video values.',
        'Conecte um perfil Steam para conferir valores de vídeo salvos.',
      ),
      loading: t('Reading Game Settings…', 'Lendo configurações do jogo…'),
      missing: t(
        'Connected · cs2_video.txt not found.',
        'Conectado · cs2_video.txt não encontrado.',
      ),
      unavailable: t(
        'Game Settings unavailable. Choose the folder again or refresh.',
        'Configurações indisponíveis. Escolha a pasta novamente ou atualize.',
      ),
      invalid: t(
        'Video text needs review; open the read-only view.',
        'Texto de vídeo precisa de revisão; abra a visualização somente leitura.',
      ),
      available: t(
        'Saved video settings · read only',
        'Configurações de vídeo salvas · somente leitura',
      ),
    };
    $('settings-status').textContent = messages[settings?.status || 'disconnected'];
    const entries = [];
    if (!settings?.connected) {
      entries.push(button(t('Connect configuration', 'Conectar configuração'), 'connect'));
    }
    const row = (title, detail, action, file) => {
      const item = node('div', undefined, 'settings-row');
      const text = node('div');
      text.append(node('strong', title), node('p', detail));
      item.append(text);
      if (action) item.append(button(t('Open', 'Abrir'), action, file));
      return item;
    };
    const resolution = settings?.video?.resolution,
      refresh = settings?.video?.refreshRate;
    const videoSummary = [
      resolution
        ? resolution.width + ' × ' + resolution.height + ' · ' + resolution.aspectRatio
        : '',
      refresh ? refresh.hz + ' Hz' : '',
    ]
      .filter(Boolean)
      .join(' · ');
    entries.push(
      row(
        t('Video', 'Vídeo'),
        videoSummary || messages[settings?.status || 'disconnected'],
        settings?.connected ? 'video' : undefined,
      ),
    );
    if (settings?.connected) entries.at(-1).querySelector('button').disabled = false;
    const controls = row(
      t('Controls', 'Controles'),
      settings?.controlsFile
        ? t('Saved controls file detected', 'Arquivo de controles salvo encontrado')
        : settings?.connected
          ? t('No saved controls file detected', 'Nenhum arquivo de controles salvo encontrado')
          : t('Not connected', 'Não conectado'),
      settings?.controlsFile ? 'savedControls' : undefined,
    );
    if (settings?.controlsFile) controls.querySelector('button').disabled = false;
    entries.push(controls);
    for (const [key, title] of [
      ['crosshair', t('Crosshair', 'Mira')],
      ['radar', 'Radar'],
    ]) {
      const file = state.files.find((file) => file.origin !== 'game' && file.summary?.[key]);
      entries.push(
        row(
          title,
          file
            ? t('Found in CFG: ', 'Encontrado em CFG: ') + file.name
            : t('Not detected in the analyzed CFGs', 'Não encontrado nas CFGs analisadas'),
          file ? 'open' : undefined,
          file?.name,
        ),
      );
    }
    $('game-settings').replaceChildren(...entries);
  }
  document.addEventListener('click', (event) => {
    const control = event.target.closest('button[data-action]');
    if (!control || control.disabled || !state) return;
    const type = control.dataset.action;
    vscode.postMessage(
      control.dataset.file
        ? { type, file: control.dataset.file, revision: state.revision }
        : { type },
    );
  });
  window.addEventListener('message', (event) => {
    if (event.data?.type === 'state') render(event.data);
  });
  vscode.postMessage({ type: 'ready' });
})();
