/* global acquireVsCodeApi, CS2InputLayout, CS2InputState, CS2InputSvg */
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
  const status = (entry) =>
    !entry.certain ? text('Uncertain', 'Incerto') : text('Modeled', 'Modelado');
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
      if (def) root.append(node('h3', def.label));
      root.append(
        node(
          'p',
          def
            ? text('No binding found in this analysis.', 'Nenhum bind encontrado nesta análise.')
            : text(
                'Select a key or mouse control to inspect its bind.',
                'Selecione uma tecla ou controle do mouse para consultar seu bind.',
              ),
        ),
      );
      return;
    }
    root.append(
      node('h3', entry.key),
      node(
        'p',
        `${text(...(categories[entry.category] ?? categories.custom))} · ${status(entry)}`,
        'metadata',
      ),
      node('pre', entry.action),
    );
    if (entry.meaning) root.append(node('p', entry.meaning));
    else
      root.append(
        node(
          'p',
          text(
            'Custom action or sequence; inspect the literal command below.',
            'Ação personalizada ou sequência; consulte o comando literal abaixo.',
          ),
        ),
      );
    if (entry.conflict)
      root.append(
        node(
          'p',
          text(
            '! Reassigned in this file. The last modeled bind is shown; replacement can be intentional.',
            '! Reatribuído neste arquivo. O último bind modelado é exibido; a substituição pode ser intencional.',
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
    root.append(reveal(index, 'origin', text('Open source', 'Abrir origem')));
    root.append(
      node('p', `${state.file}${entry.origin.line ? `:${entry.origin.line}` : ''}`, 'metadata'),
    );
    if (entry.definition.start !== entry.origin.start)
      root.append(
        reveal(index, 'definition', text('Open alias definition', 'Abrir definição do alias')),
      );
    if (entry.raw) {
      const raw = node('details');
      raw.append(node('summary', text('Raw command', 'Comando original')), node('pre', entry.raw));
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
    if (entry.history?.length) {
      const history = node('details');
      history.append(
        node(
          'summary',
          `${text('Source history', 'Histórico de origem')} (${entry.history.length})`,
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
              ? text('Current modeled bind', 'Bind modelado atual')
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
    };
    keyboard.update(entries(), visual, passes, labels);
    mouse.update(entries(), visual, passes, labels);
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
    tooltip: (def) => {
      const entry = CS2InputLayout.matches(def, entries())[0];
      $('tooltip').textContent =
        `${def.label} · ${entry ? `${entry.action} · ${status(entry)}` : text('No data in this analysis', 'Sem dados nesta análise')}`;
      $('tooltip').hidden = false;
    },
    hideTooltip: () => {
      $('tooltip').hidden = true;
    },
  };
  const keyboard = CS2InputSvg.keyboard(callbacks),
    mouse = CS2InputSvg.mouse(callbacks);
  const narrow = window.matchMedia('(max-width: 700px)');
  const collapseFilters = () => {
    $('filter-panel').open = !narrow.matches;
  };
  collapseFilters();
  narrow.addEventListener('change', collapseFilters);
  $('keyboard').append(keyboard.svg);
  $('mouse').append(mouse.svg);
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
      root.append(
        button(
          `${entry.key} · ${entry.action}`,
          () => {
            const def = [...CS2InputLayout.keys, ...CS2InputLayout.mouse].find((item) =>
              item.tokens.includes(entry.key),
            );
            select(entries()[index].key, def?.id);
          },
          `list:${entry.key}`,
        ),
      );
    });
    if (!root.children.length)
      root.append(node('p', text('No matching binds.', 'Nenhum bind corresponde ao filtro.')));
  }
  function render() {
    document.documentElement.lang = state.pt ? 'pt-BR' : 'en';
    const copy = {
      title: ['Visual bind map', 'Mapa visual de binds'],
      mode: ['Read-only · Single file', 'Somente leitura · Arquivo único'],
      'filters-title': ['Explore', 'Explorar'],
      'category-label': ['Category', 'Categoria'],
      'state-label': ['State', 'Estado'],
      'keyboard-title': ['ANSI keyboard', 'Teclado ANSI'],
      'mouse-title': ['Mouse', 'Mouse'],
      'mouse-note': ['Five buttons and scroll directions.', 'Cinco botões e direções de rolagem.'],
      'selection-help': [
        'Select any input. Enter or Space opens its details. Filters dim the layout without hiding keys.',
        'Selecione uma entrada. Enter ou Espaço abre seus detalhes. Os filtros atenuam o desenho sem ocultar teclas.',
      ],
      legend: [
        '● Assigned   ! Reassigned / ambiguous   ? Uncertain\nUnmarked: no data in this analysis.',
        '● Com bind   ! Reatribuído / ambíguo   ? Incerto\nSem marca: sem dados nesta análise.',
      ],
      'list-title': ['All literal binds', 'Todos os binds literais'],
      'analysis-title': ['Analysis details', 'Detalhes da análise'],
      scope: [
        'Single-file static analysis. Execs and unknown effects remain unresolved. Idle inputs can still have binds in the game. This physical reference does not validate CS2 key tokens. History includes assignments before explicit resets.',
        'Análise estática de arquivo único. Execs e efeitos desconhecidos permanecem não resolvidos. Entradas sem dados podem ter binds no jogo. Esta referência física não valida tokens de teclas do CS2. O histórico inclui atribuições anteriores a limpezas explícitas.',
      ],
    };
    for (const [id, label] of Object.entries(copy)) $(id).textContent = text(...label);
    $('file').textContent = state.file ?? '';
    filters('category', categories);
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
          : `${entries().length} ${text('modeled binds', 'binds modelados')} · ${entries().filter((entry) => entry.conflict).length} ${text('reassigned', 'reatribuídos')} · ${uncertain} ${text('uncertain', 'incertos')} · ${state.model?.partial ? text('Partial analysis', 'Análise parcial') : text('Modeled subset complete', 'Subconjunto modelado completo')}`;
    $('status').textContent = state.model?.partial
      ? text(
          'Unresolved effects may change the result.',
          'Efeitos não resolvidos podem alterar o resultado.',
        )
      : text(
          'No unresolved effects in the modeled subset.',
          'Nenhum efeito não resolvido no subconjunto modelado.',
        );
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
