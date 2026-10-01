/* Presentation only: folder access and CFG semantics stay in the extension host. */
(() => {
  'use strict';
  const vscode = acquireVsCodeApi();
  let state;
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
    element.disabled = !state.connected && !['choose', 'detect', 'refresh'].includes(action);
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
      'welcome-title': t('Connect your CFG folder', 'Conecte sua pasta de CFGs'),
      'welcome-copy': t(
        'Detect a Steam installation or choose a folder. You decide which directory the extension can read.',
        'Detecte uma instalação Steam ou escolha uma pasta. Você decide qual diretório a extensão pode ler.',
      ),
      detect: t('Detect automatically', 'Detectar automaticamente'),
      choose: t('Choose folder', 'Escolher pasta'),
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
      'overview-title': t('Configuration Overview', 'Visão geral das configurações'),
      'overview-copy': t(
        'Independent static summaries of the files listed below.',
        'Resumos estáticos independentes dos arquivos listados abaixo.',
      ),
      'quick-title': t('Quick Actions', 'Ações rápidas'),
      'quick-copy': t(
        'Start with a file or create an empty CFG.',
        'Abra um arquivo ou crie uma CFG vazia.',
      ),
      'files-title': t('Config Files', 'Arquivos de configuração'),
      'files-note': t(
        'Current folder · unsaved editor text is included in analysis.',
        'Pasta atual · a análise inclui alterações não salvas no editor.',
      ),
      new: t('+ New CFG', '+ Nova CFG'),
      scope: t(
        'Static analysis only. Counts are summed per file, not the running game state. External execs remain unresolved. Builders and visual editing are planned.',
        'Somente análise estática. Contagens são somadas por arquivo e não representam o jogo em execução. Execs externos permanecem não resolvidos. Builders e edição visual estão planejados.',
      ),
    };
    for (const [id, text] of Object.entries(labels)) $(id).textContent = text;
    $('connection').textContent = state.connected
      ? t('Connected', 'Conectado')
      : t('Not connected', 'Não conectado');
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

    $('tools').replaceChildren();
    const tools = [
      [
        t('Visual Bind Map', 'Mapa visual de binds'),
        t(
          'Inspect keyboard and mouse binds, meanings and source history.',
          'Explore binds do teclado e mouse, descrições e histórico de origem.',
        ),
        'keyboard',
        'bindMap',
      ],
      [
        t('Create Autoexec', 'Criar autoexec'),
        t(
          'Guided creation using the shared command registry.',
          'Criação guiada com o catálogo compartilhado.',
        ),
        'file',
      ],
      [
        t('Practice Config', 'CFG de treino'),
        t(
          'Build a practice configuration with reviewed settings.',
          'Monte uma configuração de treino com parâmetros revisados.',
        ),
        'target',
      ],
      [
        t('Alias Builder', 'Builder de aliases'),
        t(
          'Compose reusable actions with a reviewable preview.',
          'Componha ações reutilizáveis com prévia para revisão.',
        ),
        'terminal',
      ],
      [
        t('Command Explorer', 'Explorador de comandos'),
        t(
          'Browse command documentation in a dedicated panel.',
          'Explore a documentação dos comandos em um painel dedicado.',
        ),
        'search',
      ],
    ];
    const firstFile =
      state.files.find((file) => file.name.toLowerCase() === 'autoexec.cfg')?.name ||
      state.files[0]?.name;
    for (const [title, copy, glyph, action] of tools) {
      const card = button('', action || 'planned', action ? firstFile : undefined, 'tool-card');
      card.append(
        icon(glyph),
        node('h2', title),
        node('p', copy),
        node('span', action ? '→' : t('Planned', 'Planejado'), 'card-footer'),
      );
      card.disabled = !action || !firstFile || !state.connected;
      $('tools').append(card);
    }
    const summaries = state.files.filter((file) => file.summary).map((file) => file.summary);
    $('stats').replaceChildren();
    const totals = [
      state.files.length,
      ...['binds', 'settings', 'aliases'].map((key) =>
        summaries.reduce((sum, summary) => sum + summary[key], 0),
      ),
    ];
    const statLabels = [
      t('CFG files', 'Arquivos CFG'),
      t('Modeled binds', 'Binds modelados'),
      t('Certain settings', 'Configurações determinadas'),
      t('Modeled aliases', 'Aliases modelados'),
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
    $('quick').replaceChildren();
    if (firstFile) {
      for (const [title, action] of [
        [t('Open', 'Abrir'), 'open'],
        [t('View Bind Map', 'Ver mapa de binds'), 'bindMap'],
        [t('Health Check', 'Verificar CFG'), 'health'],
      ])
        $('quick').append(button(`${title} · ${firstFile}`, action, firstFile));
    }
    $('quick').append(button(t('Create new empty CFG', 'Criar nova CFG vazia'), 'new'));
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
    for (const file of state.files) {
      const row = node('tr');
      const name = node('td');
      name.append(button(file.name, 'open', file.name, 'file-link'));
      const status = file.summary
        ? file.summary.partial
          ? t('Partial', 'Parcial')
          : t('Modeled subset', 'Subconjunto modelado')
        : t('Not analyzed', 'Não analisado');
      row.append(
        name,
        node('td', String(file.summary?.binds ?? '—')),
        node('td', String(file.summary?.findings ?? '—')),
        node('td', status),
      );
      const actions = node('td', undefined, 'row-actions');
      actions.append(
        button(t('Bind Map', 'Mapa de binds'), 'bindMap', file.name),
        button(t('Inspect', 'Verificar'), 'health', file.name),
      );
      row.append(actions);
      $('files').append(row);
    }
    $('empty').textContent = !state.files.length
      ? t('No CFG files to display.', 'Nenhum arquivo CFG para exibir.')
      : state.limited
        ? t(
            'Showing the first 100 files. Folder totals are limited to this list.',
            'Exibindo os primeiros 100 arquivos. Os totais estão limitados a esta lista.',
          )
        : summaries.length < state.files.length
          ? t(
              'Some files could not be analyzed or exceeded the size limit; their counts are excluded.',
              'Alguns arquivos não puderam ser analisados ou excederam o limite de tamanho; suas contagens não foram incluídas.',
            )
          : '';
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
