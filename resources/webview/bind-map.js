/* global acquireVsCodeApi */
(() => {
  const vscode = acquireVsCodeApi();
  let state;
  let selected;
  const element = (tag, text, className) => {
    const node = document.createElement(tag);
    if (text !== undefined) node.textContent = text;
    if (className) node.className = className;
    return node;
  };
  const text = (en, pt) => (state.pt ? pt : en);
  const label = (entry) =>
    entry.certain ? text('Modeled', 'Modelado') : text('Uncertain', 'Incerto');
  function revealButton(title, index, target) {
    const button = element('button', title);
    button.dataset.focusId = `detail:${selected}:${target}`;
    button.type = 'button';
    button.addEventListener('click', () => {
      vscode.postMessage({
        type: 'reveal',
        snapshot: state.snapshot,
        version: state.version,
        entry: index,
        target,
      });
    });
    return button;
  }
  function details(index) {
    const container = document.getElementById('details');
    container.replaceChildren();
    const entry = state.model?.entries[index];
    if (!entry) {
      container.append(
        element(
          'p',
          text(
            'Select a modeled key to inspect its bind.',
            'Selecione uma tecla modelada para consultar seu bind.',
          ),
        ),
      );
      return;
    }
    selected = entry.key;
    container.append(
      element('h3', entry.key),
      element('p', label(entry)),
      element('pre', entry.action),
    );
    const actions = element('div', undefined, 'actions');
    actions.append(revealButton(text('Open source', 'Abrir origem'), index, 'origin'));
    if (entry.definition.start !== entry.origin.start)
      actions.append(
        revealButton(
          text('Open alias definition', 'Abrir definição do alias'),
          index,
          'definition',
        ),
      );
    entry.changes.forEach((change, i) => {
      const title =
        change.kind === 'redundant'
          ? text('Previous repeated bind', 'Bind anterior repetido')
          : text('Previous replaced bind', 'Bind anterior substituído');
      actions.append(revealButton(`${title} ${i + 1}`, index, i));
    });
    container.append(actions);
  }
  function select(index) {
    details(index);
    document.getElementById('detail-title').focus();
  }
  // A reference layout, never a validator or a source of command semantics.
  const groups = [
    [
      'Keyboard · QWERTY reference',
      'Teclado · referência QWERTY',
      [
        ['escape', 'f1', 'f2', 'f3', 'f4', 'f5', 'f6', 'f7', 'f8', 'f9', 'f10', 'f11', 'f12'],
        ['`', '1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '-', '=', 'backspace'],
        ['tab', 'q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p', '[', ']', '\\'],
        ['capslock', 'a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', ';', "'", 'enter'],
        ['shift', 'z', 'x', 'c', 'v', 'b', 'n', 'm', ',', '.', '/', 'rshift'],
        ['ctrl', 'alt', 'space', 'ralt', 'rctrl'],
        [
          'ins',
          'home',
          'pgup',
          'del',
          'end',
          'pgdn',
          'leftarrow',
          'uparrow',
          'downarrow',
          'rightarrow',
        ],
      ],
    ],
    [
      'Mouse',
      'Mouse',
      [
        ['mouse1', 'mouse2', 'mouse3', 'mouse4', 'mouse5'],
        ['mwheelup', 'mwheeldown'],
      ],
    ],
    [
      'Numpad',
      'Teclado numérico',
      [
        ['numlock', 'kp_divide', 'kp_multiply', 'kp_minus'],
        ['kp_home', 'kp_uparrow', 'kp_pgup', 'kp_plus'],
        ['kp_leftarrow', 'kp_5', 'kp_rightarrow'],
        ['kp_end', 'kp_downarrow', 'kp_pgdn', 'kp_enter'],
        ['kp_ins', 'kp_del'],
      ],
    ],
  ];
  function render() {
    document.documentElement.lang = state.pt ? 'pt-BR' : 'en';
    document.getElementById('title').textContent = text('Visual bind map', 'Mapa visual de binds');
    document.getElementById('file').textContent = state.file;
    document.getElementById('scope').textContent = text(
      'Read-only, single-file static model. Keys without data are not necessarily unbound. Literal key names are preserved; this layout does not validate game key names.',
      'Modelo estático de arquivo único, somente leitura. Teclas sem informação podem ter binds no jogo. Nomes literais são preservados; o desenho não valida nomes de teclas do jogo.',
    );
    document.getElementById('legend').textContent = text(
      'Modeled: literal bind recorded. Uncertain: unresolved effects may have changed it. No information: absent from this model.',
      'Modelado: bind literal registrado. Incerto: efeitos não resolvidos podem tê-lo alterado. Sem informação: ausente deste modelo.',
    );
    document.getElementById('list-title').textContent = text(
      'All modeled binds',
      'Todos os binds modelados',
    );
    document.getElementById('detail-title').textContent = text('Selected bind', 'Bind selecionado');
    const status = document.getElementById('status');
    status.textContent = state.unavailable
      ? text(
          'Source closed. Open a CFG and run the bind map command again.',
          'Origem fechada. Abra uma CFG e execute o comando do mapa novamente.',
        )
      : state.oversized
        ? text(
            'Analysis paused: document exceeds the analysis limit.',
            'Análise pausada: documento excede o limite de análise.',
          )
        : state.model.partial
          ? text(
              'Partial result: unresolved effects may change binds.',
              'Resultado parcial: efeitos não resolvidos podem alterar os binds.',
            )
          : text(
              'No unresolved effects in the modeled subset.',
              'Nenhum efeito não resolvido no subconjunto modelado.',
            );
    status.className = state.model?.partial ? 'uncertain' : '';
    const layout = document.getElementById('layout');
    const list = document.getElementById('list');
    layout.replaceChildren();
    list.replaceChildren();
    if (!state.model) {
      details(-1);
      return;
    }
    if (state.model.limits.length) {
      const limits = element('ul');
      const meanings = {
        exec: text('External CFG unresolved', 'CFG externa não resolvida'),
        dynamic: text('Unknown or unsupported effect', 'Efeito desconhecido ou não suportado'),
        syntax: text('Incomplete or invalid syntax', 'Sintaxe incompleta ou inválida'),
        'alias-cycle': text(
          'Alias cycle or depth limit',
          'Ciclo de alias ou limite de profundidade',
        ),
        budget: text('Analysis budget reached', 'Limite de análise atingido'),
      };
      for (const limit of state.model.limits)
        limits.append(
          element(
            'li',
            `${meanings[limit.code] ?? limit.code}${limit.name ? ` · ${limit.name}` : ''}`,
          ),
        );
      layout.append(limits);
    }
    const entries = state.model.entries;
    for (const [en, pt, rows] of groups) {
      const section = element('section');
      section.append(element('h2', text(en, pt)));
      for (const keys of rows) {
        const row = element('div', undefined, 'key-row');
        for (const key of keys) {
          const index = entries.findIndex((entry) => entry.key === key);
          const entry = entries[index];
          const keycap = element(
            entry ? 'button' : 'span',
            key,
            `key ${entry ? (entry.certain ? 'modeled' : 'uncertain') : 'empty'}`,
          );
          if (entry) {
            keycap.type = 'button';
            keycap.dataset.focusId = `key:${entry.key}`;
            keycap.title = `${key}: ${entry.action}`;
            keycap.setAttribute('aria-label', `${key}: ${entry.action} · ${label(entry)}`);
            keycap.addEventListener('click', () => select(index));
          } else keycap.title = text('No information in this model', 'Sem informação neste modelo');
          row.append(keycap);
        }
        section.append(row);
      }
      layout.append(section);
    }
    // Every literal name remains reachable, including uppercase and custom names.
    entries.forEach((entry, index) => {
      const button = element(
        'button',
        `${entry.key} · ${entry.action} · ${label(entry)}${entry.changes.length ? ` · ${text('changes', 'alterações')}: ${entry.changes.length}` : ''}`,
        'bind-item',
      );
      button.type = 'button';
      button.dataset.focusId = `list:${entry.key}`;
      button.addEventListener('click', () => select(index));
      list.append(button);
    });
    if (!entries.length)
      list.append(element('p', text('No binds modeled.', 'Nenhum bind modelado.')));
    details(entries.findIndex((entry) => entry.key === selected));
  }
  window.addEventListener('message', (event) => {
    if (event.data?.type !== 'state') return;
    const focus = document.activeElement;
    const focusedId = focus?.dataset?.focusId;
    const sameSource = state?.source === event.data.source;
    if (!sameSource || !event.data.model) selected = undefined;
    state = event.data;
    render();
    if (focusedId) {
      const replacement = sameSource
        ? [...document.querySelectorAll('button')].find(
            (button) => button.dataset.focusId === focusedId,
          )
        : undefined;
      (replacement ?? document.getElementById('detail-title')).focus();
    }
  });
  vscode.postMessage({ type: 'ready' });
})();
