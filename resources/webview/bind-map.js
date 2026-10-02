/* global acquireVsCodeApi, CS2InputLayout, CS2InputState, CS2InputSvg, CS2ChoicePicker */
(() => {
  const vscode = acquireVsCodeApi();
  let state = { pt: false },
    selected,
    visual;
  const $ = (id) => document.getElementById(id);
  const text = (en, pt) => (state.pt ? pt : en);
  const node = (tag, content, className) => {
    const el = document.createElement(tag);
    if (content !== undefined) el.textContent = content;
    if (className) el.className = className;
    return el;
  };
  const categories = {
    all: ['All categories', 'Todas as categorias'],
    movement: ['Movement', 'Movimento'],
    weapons: ['Weapons', 'Armas'],
    grenades: ['Grenades', 'Granadas'],
    communication: ['Communication', 'Comunicação'],
    buy: ['Buy', 'Compras'],
    utility: ['Utility', 'Utilitários'],
    interface: ['Interface', 'Interface'],
    custom: ['Custom / unknown', 'Personalizado / desconhecido'],
  };
  const states = {
    all: ['All states', 'Todos os estados'],
    assigned: ['Assigned', 'Com bind'],
    idle: ['No data', 'Sem dados'],
    conflict: ['Reassigned / ambiguous', 'Reatribuído / ambíguo'],
    uncertain: ['Uncertain', 'Incerto'],
  };
  const entries = () => state.model?.entries ?? [];
  const categoryDot = (category) => {
    const dot = node('span', undefined, 'category-dot category-swatch');
    dot.dataset.category = category;
    dot.setAttribute('aria-hidden', 'true');
    return dot;
  };
  const status = (entry) =>
    !entry.certain ? text('Uncertain', 'Incerto') : text('Assigned', 'Com bind');
  const inputName = (def) =>
    def?.cs2Key === 'mouse3'
      ? text('Wheel click', 'Clique da roda')
      : def?.cs2Key === 'mwheelup'
        ? text('Wheel up', 'Rolar para cima')
        : def?.cs2Key === 'mwheeldown'
          ? text('Wheel down', 'Rolar para baixo')
          : def?.label;
  const passes = (entry, conflict) => {
    const category = $('category').value;
    const filter = $('state-filter').value;
    return CS2InputState.matchesFilters(entry, conflict, category, filter);
  };
  function button(label, callback, focusId) {
    const el = node('button', label);
    el.type = 'button';
    if (focusId) el.dataset.focusId = focusId;
    el.addEventListener('click', callback);
    return el;
  }
  function reveal(index, target, label) {
    return button(
      label,
      () =>
        vscode.postMessage({
          type: 'reveal',
          snapshot: state.snapshot,
          version: state.version,
          entry: index,
          target,
        }),
      `detail:${selected}:${target}`,
    );
  }
  function inspector() {
    const root = $('details');
    root.replaceChildren();
    const index = entries().findIndex((entry) => entry.key === selected);
    const entry = entries()[index];
    const def = [...CS2InputLayout.keys, ...CS2InputLayout.mouse].find(
      (item) => item.id === visual,
    );
    $('detail-title').textContent = text('Selected input', 'Entrada selecionada');
    if (!entry) {
      if (def) root.append(node('h3', inputName(def)));
      root.append(
        node(
          'p',
          def
            ? text('No binding found in this analysis.', 'Nenhum bind encontrado nesta análise.')
            : text(
                'No input selected. Choose a key or mouse control to inspect its action, command, source and history.',
                'Nenhuma entrada selecionada. Escolha uma tecla ou controle do mouse para consultar ação, comando, origem e histórico.',
              ),
          'empty-copy',
        ),
      );
      return;
    }
    const heading = node('div', undefined, 'selection-heading');
    const description = node('div');
    description.append(
      node('p', entry.meaning ?? text('Custom action', 'Ação personalizada'), 'meaning'),
      node(
        'p',
        text(...(categories[entry.category] ?? categories.custom)) + ' · ' + status(entry),
        'metadata',
      ),
    );
    description.querySelector('.metadata').prepend(categoryDot(entry.category));
    heading.append(node('h3', inputName(def) ?? entry.key), description);
    root.append(heading, node('pre', entry.action));
    const source = node('div', undefined, 'source-actions');
    source.append(
      reveal(index, 'origin', text('Open source', 'Abrir origem')),
      node(
        'p',
        `${(state.file ?? '').split(/[/\\]/).pop()}${entry.origin.line ? `:${entry.origin.line}` : ''}`,
        'metadata',
      ),
    );
    root.append(source);
    if (entry.conflict)
      root.append(
        node(
          'p',
          text(
            '! Reassigned in this file. The last recorded bind is shown; replacement can be intentional.',
            '! Reatribuído neste arquivo. O último bind registrado é exibido; a substituição pode ser intencional.',
          ),
          'notice',
        ),
      );
    if (!entry.certain)
      root.append(
        node(
          'p',
          text(
            '? Unresolved effects may have changed this bind. See analysis details.',
            '? Efeitos não resolvidos podem ter alterado este bind. Consulte os detalhes da análise.',
          ),
          'notice',
        ),
      );
    if (entry.definition.start !== entry.origin.start)
      root.append(
        reveal(index, 'definition', text('Open alias definition', 'Abrir definição do alias')),
      );
    if (entry.raw) {
      const raw = node('details');
      raw.append(node('summary', text('Raw bind', 'Bind original')), node('pre', entry.raw));
      root.append(raw);
    }
    if (def) {
      const candidates = CS2InputLayout.matches(def, entries());
      if (candidates.length > 1) {
        root.append(
          node(
            'p',
            text(
              'Multiple literal names map to this reference key. Inspect each separately:',
              'Mais de um nome literal corresponde a esta tecla de referência. Consulte cada um separadamente:',
            ),
          ),
        );
        for (const candidate of candidates)
          root.append(button(candidate.key, () => select(candidate.key, def.id)));
      }
    }
    if (entry.history?.length > 1) {
      const history = node('details');
      history.append(
        node(
          'summary',
          `${text('Binding history', 'Histórico de binds')} (${entry.history.length})`,
        ),
      );
      const list = node('ol');
      entry.history.forEach((event, i) => {
        const item = node('li');
        item.append(
          node('code', event.action),
          node(
            'p',
            event.effective
              ? text('Current assignment', 'Atribuição atual')
              : text('Earlier assignment', 'Atribuição anterior'),
          ),
          reveal(
            index,
            `history:${i}`,
            `${text('Open line', 'Abrir linha')} ${event.origin.line ?? i + 1}`,
          ),
        );
        list.append(item);
      });
      history.append(list);
      root.append(history);
    }
  }
  function refreshSurfaces() {
    const labels = {
      empty: text('No data in this analysis', 'Sem dados nesta análise'),
      conflict: text('Reassigned / ambiguous', 'Reatribuído / ambíguo'),
      uncertain: text('Uncertain', 'Incerto'),
      names: {
        mouse1: text('Left click', 'Clique esquerdo'),
        mouse2: text('Right click', 'Clique direito'),
        mouse3: text('Wheel click', 'Clique da roda'),
        mouse4: text('Side button 1', 'Botão lateral 1'),
        mouse5: text('Side button 2', 'Botão lateral 2'),
        mwheelup: text('Wheel up', 'Rolar para cima'),
        mwheeldown: text('Wheel down', 'Rolar para baixo'),
      },
    };
    keyboard.update(entries(), visual, passes, labels);
    mouse.update(entries(), visual, passes, labels);
    mouseControls.update(entries(), visual, passes, labels);
  }
  function select(key, id) {
    selected = key;
    visual = id;
    refreshSurfaces();
    inspector();
    $('detail-title').focus();
  }
  const callbacks = {
    select: (def) => {
      const selection = CS2InputState.select(def, CS2InputLayout.matches(def, entries()));
      select(selection.key, selection.visualId);
    },
    tooltip: (def, element) => {
      const entry = CS2InputLayout.matches(def, entries())[0];
      $('tooltip').textContent =
        `${inputName(def)} · ${entry ? `${entry.meaning ?? entry.action} · ${status(entry)}` : text('No data in this analysis', 'Sem dados nesta análise')}`;
      $('tooltip').hidden = false;
      const tip = $('tooltip'),
        rect = element.getBoundingClientRect();
      tip.style.maxWidth = Math.min(360, window.innerWidth - 24) + 'px';
      tip.style.left =
        Math.max(12, Math.min(rect.left, window.innerWidth - tip.offsetWidth - 12)) + 'px';
      tip.style.top =
        Math.max(
          12,
          rect.bottom + tip.offsetHeight + 8 < window.innerHeight
            ? rect.bottom + 8
            : rect.top - tip.offsetHeight - 8,
        ) + 'px';
    },
    hideTooltip: () => {
      $('tooltip').hidden = true;
    },
  };
  const keyboard = CS2InputSvg.keyboard(callbacks),
    mouse = CS2InputSvg.mouse(callbacks),
    mouseControls = CS2InputSvg.controls(CS2InputLayout.mouse, callbacks);
  const narrow = window.matchMedia('(max-width: 899px)');
  const collapseFilters = () => {
    $('filter-panel').open = !narrow.matches;
  };
  collapseFilters();
  narrow.addEventListener('change', collapseFilters);
  $('keyboard').append(keyboard.svg);
  $('mouse').append(mouse.svg);
  $('mouse-actions').append(...mouseControls.nodes);
  const categoryPicker = CS2ChoicePicker(
    $('category'),
    $('category-menu'),
    'category-value',
    () => {
      refreshSurfaces();
      renderList();
    },
  );
  function filters(id, options) {
    const el = $(id),
      previous = el.value || 'all';
    el.replaceChildren(
      ...Object.entries(options).map(([value, label]) => {
        const option = node('option', text(...label));
        option.value = value;
        return option;
      }),
    );
    el.value = previous;
  }
  function renderList() {
    const root = $('list');
    root.replaceChildren();
    entries().forEach((entry, index) => {
      if (!passes(entry, entry.conflict)) return;
      const item = button(
        undefined,
        () => {
          const def = [...CS2InputLayout.keys, ...CS2InputLayout.mouse].find((item) =>
            item.tokens.includes(entry.key),
          );
          select(entries()[index].key, def?.id);
        },
        `list:${entry.key}`,
      );
      item.className = 'bind-item';
      item.title = `${entry.key}: ${entry.action}`;
      const action = node('span', undefined, 'bind-action');
      action.append(
        node('span', entry.meaning ?? text('Custom action', 'Ação personalizada'), 'bind-name'),
        node('code', entry.action, 'bind-command'),
      );
      const key = node('kbd', entry.key, 'bind-key');
      key.append(categoryDot(entry.category));
      item.append(key, action);
      root.append(item);
    });
    if (!root.children.length)
      root.append(node('p', text('No matching binds.', 'Nenhum bind corresponde ao filtro.')));
  }
  function render() {
    document.documentElement.lang = state.pt ? 'pt-BR' : 'en';
    const copy = {
      title: ['Visual bind map', 'Mapa visual de binds'],
      intro: [
        'Inspect keyboard and mouse bindings, actions and source locations.',
        'Consulte binds de teclado e mouse, ações e linhas de origem.',
      ],
      mode: ['Read-only · Single file', 'Somente leitura · Arquivo único'],
      'filters-title': ['Filters', 'Filtros'],
      'category-label': ['Category', 'Categoria'],
      'state-label': ['State', 'Estado'],
      'keyboard-title': ['ANSI keyboard', 'Teclado ANSI'],
      'mouse-title': ['Mouse', 'Mouse'],
      'mouse-note': ['Five buttons + wheel inputs', 'Cinco botões + entradas da roda'],
      'selection-help': [
        'Select an input to inspect it. Scroll horizontally to reach more keys.',
        'Selecione uma entrada para consultá-la. Role na horizontal para acessar mais teclas.',
      ],
      'legend-title': ['Status', 'Estado'],
      'list-title': ['Literal binds', 'Binds literais'],
      'analysis-title': ['Analysis details', 'Detalhes da análise'],
      scope: [
        'Single-file static analysis. Execs and unknown effects remain unresolved. Idle inputs can still have binds in the game. This physical reference does not validate CS2 key tokens. History includes assignments before explicit resets.',
        'Análise estática de arquivo único. Execs e efeitos desconhecidos permanecem não resolvidos. Entradas sem dados podem ter binds no jogo. Esta referência física não valida tokens de teclas do CS2. O histórico inclui atribuições anteriores a limpezas explícitas.',
      ],
    };
    for (const [id, label] of Object.entries(copy)) $(id).textContent = text(...label);
    $('file').textContent = (state.file ?? '').split(/[/\\]/).pop();
    $('file').setAttribute('aria-label', state.file ?? '');
    $('file').title = state.file ?? '';
    $('legend').replaceChildren(
      ...[
        ['●', text('Assigned', 'Com bind')],
        ['!', text('Reassigned / ambiguous', 'Reatribuído / ambíguo')],
        ['◌', text('Uncertain · dashed border', 'Incerto · borda tracejada')],
        ['○', text('No data', 'Sem dados')],
      ].map(([symbol, label]) => node('li', `${symbol} ${label}`)),
    );
    categoryPicker.update(
      Object.entries(categories).map(([value, label]) => [value, text(...label)]),
    );
    filters('state-filter', states);
    const uncertain = entries().filter((entry) => !entry.certain).length;
    $('retry').hidden = !state.failed;
    $('retry').textContent = text('Retry', 'Tentar novamente');
    $('summary').textContent = state.failed
      ? text(
          'Unable to build bind map. Retry or inspect the Extension Host log.',
          'Não foi possível gerar o mapa. Tente novamente ou consulte o log do Extension Host.',
        )
      : state.unavailable
        ? text(
            'Source closed. Open a CFG and reopen the map.',
            'Origem fechada. Abra uma CFG e reabra o mapa.',
          )
        : state.oversized
          ? text(
              'Analysis paused: file exceeds the size limit.',
              'Análise pausada: arquivo excede o limite de tamanho.',
            )
          : `${entries().length} ${text('binds', 'binds')} · ${entries().filter((entry) => entry.conflict).length} ${text('reassigned', 'reatribuídos')} · ${uncertain} ${text('uncertain', 'incertos')}${state.model?.partial ? ` · ${text('Some effects unresolved', 'Há efeitos não resolvidos')}` : ''}`;
    $('status').textContent = state.model?.partial
      ? text(
          'Unresolved effects may change the result.',
          'Efeitos não resolvidos podem alterar o resultado.',
        )
      : text('No unresolved effects.', 'Nenhum efeito não resolvido.');
    $('limits').replaceChildren(
      ...(state.model?.limits ?? []).map((limit) =>
        node('li', `${limit.code}${limit.name ? ` · ${limit.name}` : ''}`),
      ),
    );
    refreshSurfaces();
    renderList();
    inspector();
  }
  for (const id of ['category', 'state-filter'])
    $(id).addEventListener('change', () => {
      refreshSurfaces();
      renderList();
    });
  $('retry').addEventListener('click', () => vscode.postMessage({ type: 'ready' }));
  window.addEventListener('message', (event) => {
    if (event.data?.type !== 'state') return;
    const focusedId = document.activeElement?.dataset?.focusId;
    const sameSource = state.source === event.data.source;
    if (!sameSource || !event.data.model) {
      selected = undefined;
      visual = undefined;
    }
    state = event.data;
    callbacks.hideTooltip();
    render();
    if (focusedId) {
      const replacement = sameSource
        ? [...document.querySelectorAll('[data-focus-id]')].find(
            (el) => el.dataset.focusId === focusedId,
          )
        : undefined;
      (replacement ?? $('detail-title')).focus();
    }
  });
  vscode.postMessage({ type: 'ready' });
})();
