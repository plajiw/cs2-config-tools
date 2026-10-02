/* UI submits typed actions; registry, validation and source writing stay in the host. */
(() => {
  'use strict';
  const vscode = acquireVsCodeApi();
  const $ = (id) => document.getElementById(id);
  let state = {},
    actions = [],
    changes = [],
    snapshot,
    warnings = [];
  const t = (en, pt) => (state.pt ? pt : en);
  const node = (tag, text) => {
    const e = document.createElement(tag);
    if (text !== undefined) e.textContent = text;
    return e;
  };
  const post = (message) => vscode.postMessage(message);
  const invalidate = () => {
    snapshot = undefined;
    $('preview-section').hidden = true;
    $('apply').disabled = true;
  };
  function renderActions(next) {
    actions = next;
    const selected = $('action').value;
    $('action').replaceChildren();
    const groups = new Map();
    const categories = {
      grenades: ['Grenades', 'Granadas'],
      weapons: ['Weapons', 'Armas'],
      movement: ['Movement', 'Movimento'],
      communication: ['Communication', 'Comunicação'],
      utility: ['Utility', 'Utilitários'],
      buy: ['Buy', 'Compra'],
      interface: ['Interface', 'Interface'],
      custom: ['Other commands / ConVars', 'Outros comandos / ConVars'],
    };
    for (const action of actions) {
      if (!groups.has(action.category)) {
        const group = node('optgroup');
        group.label = t(...(categories[action.category] || categories.custom));
        groups.set(action.category, group);
        $('action').append(group);
      }
      const option = node('option', `${action.label}   ·   ${action.command}`);
      option.value = action.command;
      groups.get(action.category).append(option);
    }
    if (actions.some((a) => a.command === selected)) $('action').value = selected;
    else $('action').selectedIndex = actions.length ? 0 : -1;
    describe();
  }
  function describe() {
    const action = actions.find((a) => a.command === $('action').value);
    $('action-description').textContent = action?.description || '';
    $('parameters-row').hidden = !!action?.confidence;
    $('parameter-help').textContent = action?.confidence
      ? ''
      : action?.parameter?.values
        ? action.parameter.values
            .map((v) => `${v.value}: ${state.pt ? v['pt-BR'] || v.en : v.en}`)
            .join(' · ')
        : t(
            'Optional technical parameters, separated by spaces. Quotes, scripts and escapes are unsupported; unknown signatures require review.',
            'Parâmetros técnicos opcionais separados por espaços. Aspas, scripts e escapes não são suportados; assinaturas desconhecidas exigem revisão.',
          );
    if (action?.confidence) $('parameters').value = '';
  }
  function renderChanges() {
    $('bindings').replaceChildren();
    $('empty').hidden = changes.length > 0;
    for (const [index, change] of changes.entries()) {
      const row = node('div');
      row.className = 'binding';
      const copy = node('div');
      copy.className = 'action-copy';
      copy.append(
        node('strong', change.label),
        node('code', [change.action.command, ...change.action.parameters].join(' ')),
      );
      const replace = node('label');
      replace.className = 'replace';
      const checkbox = node('input');
      checkbox.type = 'checkbox';
      checkbox.checked = change.replace;
      checkbox.addEventListener('change', () => {
        change.replace = checkbox.checked;
        invalidate();
      });
      replace.append(checkbox, node('span', t('Replace existing', 'Substituir existente')));
      const remove = node('button', t('Remove', 'Remover'));
      remove.setAttribute(
        'aria-label',
        t(`Remove bind ${change.key}`, `Remover bind ${change.key}`),
      );
      remove.onclick = () => {
        changes.splice(index, 1);
        invalidate();
        renderChanges();
      };
      row.append(node('kbd', change.key.toUpperCase()), copy, replace, remove);
      $('bindings').append(row);
    }
    $('generated').textContent = changes
      .map((c) => `bind "${c.key}" "${[c.action.command, ...c.action.parameters].join(' ')}"`)
      .join('\n');
    $('review').disabled = !changes.length || !state.destination;
  }
  function issue(code) {
    const [kind, name] = code.split(':');
    const messages = {
      'replace-required': [
        'Key already bound. Review the current action below, then explicitly select Replace existing.',
        'Tecla já vinculada. Confira a ação atual abaixo e marque Substituir existente.',
      ],
      'duplicate-key': [
        'Key appears more than once in this draft.',
        'Tecla aparece mais de uma vez neste rascunho.',
      ],
      'invalid-key': ['Unsupported key in this MVP.', 'Tecla não suportada neste MVP.'],
      'unavailable-command': [
        'Command unavailable or unsupported.',
        'Comando indisponível ou não suportado.',
      ],
      'unsafe-action': [
        'Unsafe parameters: use single tokens without quotes, separators or escapes.',
        'Parâmetros inseguros: use tokens sem aspas, separadores ou escapes.',
      ],
      'invalid-parameter': [
        'Parameter violates known type, value or range.',
        'Parâmetro viola tipo, valor ou intervalo conhecido.',
      ],
      'argument-count': [
        'A ConVar action requires exactly one value.',
        'Uma ação ConVar exige exatamente um valor.',
      ],
      'slot-arguments': [
        'Inventory slot actions have no parameter controls.',
        'Ações de slot não possuem controles de parâmetros.',
      ],
      'alias-shadow': [
        'A local alias shadows this command; edit manually.',
        'Um alias local oculta este comando; edite manualmente.',
      ],
      'ambiguous-key': [
        'Case variants make this key ambiguous; edit manually.',
        'Variações de maiúsculas tornam esta tecla ambígua; edite manualmente.',
      ],
      'partial-source': [
        'Single-file analysis is incomplete. External execs and dynamic effects remain unresolved.',
        'A análise deste arquivo é parcial. Execs externos e efeitos dinâmicos permanecem não resolvidos.',
      ],
      'unknown-signature': [
        'Argument signature is unknown; review the raw action.',
        'Assinatura de parâmetros desconhecida; revise a ação técnica.',
      ],
      'unknown-parameter': [
        'Parameter semantics are unknown; review the value.',
        'Semântica do parâmetro desconhecida; revise o valor.',
      ],
      'not-runtime-verified': [
        'No in-game validation for this action; item/context availability is not guaranteed.',
        'Sem validação no jogo para esta ação; disponibilidade de item/contexto não garantida.',
      ],
      'restricted-command': [
        'Command has context/permission flags; review before use.',
        'Comando possui flags de contexto/permissão; revise antes de usar.',
      ],
      'review-availability': [
        'Command availability requires review; a console report is not proof of removal.',
        'Disponibilidade exige revisão; um relato de console não comprova remoção.',
      ],
      'append-override': [
        'An explicit bind is appended; uncertain or indirect source writes remain unchanged.',
        'Um bind explícito é acrescentado; escritas incertas ou indiretas permanecem intactas.',
      ],
      'malformed-or-large-source': [
        'Malformed or oversized destination; edit manually first.',
        'Destino malformado ou muito grande; edite manualmente primeiro.',
      ],
      'empty-or-large-change': ['Add between one and 100 binds.', 'Adicione entre um e 100 binds.'],
    };
    return (
      (name ? `${name}: ` : '') +
      t(...(messages[kind] || ['Review this change.', 'Revise esta alteração.']))
    );
  }
  function updateApply() {
    $('apply').disabled = !snapshot || (warnings.length > 0 && !$('acknowledge').checked);
  }
  window.addEventListener('message', ({ data }) => {
    if (data.type === 'state') {
      const changed = state.destination !== data.destination;
      state = data;
      document.documentElement.lang = state.pt ? 'pt-BR' : 'en';
      const labels = {
        intro: [
          'Create simple binds, review their meaning and apply localized edits.',
          'Crie binds simples, revise seus significados e aplique alterações localizadas.',
        ],
        'destination-title': ['Destination', 'Destino'],
        destination: ['Choose / change CFG', 'Escolher / trocar CFG'],
        'add-title': ['Add bind', 'Adicionar bind'],
        'key-label': ['Key / mouse', 'Tecla / mouse'],
        'search-label': ['Search actions', 'Buscar ações'],
        'action-label': [
          'Action · raw command always visible',
          'Ação · comando técnico sempre visível',
        ],
        'parameters-label': ['Technical parameters', 'Parâmetros técnicos'],
        add: ['Add bind', 'Adicionar bind'],
        'bindings-title': ['Bindings', 'Binds'],
        empty: [
          'No binds in this draft. Your destination is unchanged.',
          'Nenhum bind neste rascunho. O destino permanece intacto.',
        ],
        'generated-title': ['Generated CFG', 'CFG gerada'],
        review: ['Review changes', 'Revisar alterações'],
        'preview-title': ['Review changes', 'Revisar alterações'],
        'raw-title': ['Raw CFG diff', 'Diff técnico da CFG'],
        'raw-editor': ['Open full editor diff', 'Abrir diff completo no editor'],
        'acknowledge-label': [
          'I reviewed the uncertainty and context notes above.',
          'Revisei as observações de incerteza e contexto acima.',
        ],
        apply: ['Apply to editor', 'Aplicar no editor'],
        cancel: ['Cancel preview', 'Cancelar preview'],
      };
      for (const [id, values] of Object.entries(labels)) $(id).textContent = t(...values);
      $('destination-path').textContent =
        state.destination ||
        t('Choose an existing or new CFG.', 'Escolha uma CFG existente ou nova.');
      if (!$('key').options.length)
        for (const key of state.keys) {
          const option = node('option', key.toUpperCase());
          option.value = key;
          $('key').append(option);
        }
      if (changed) invalidate();
      renderActions(state.actions);
      renderChanges();
    }
    if (data.type === 'actions') renderActions(data.actions);
    if (data.type === 'preview') {
      $('status').textContent = '';
      const preview = data.preview;
      warnings = preview.warnings;
      snapshot = preview.errors.length ? undefined : data.snapshot;
      $('preview-section').hidden = false;
      $('acknowledge').checked = false;
      $('acknowledge').parentElement.hidden = !warnings.length;
      $('human-diff').replaceChildren();
      for (const diff of preview.human) {
        const row = node('div');
        row.className = 'human-change';
        row.append(
          node('kbd', diff.key.toUpperCase()),
          node(
            'div',
            `${diff.before || t('Unbound in this file', 'Sem bind neste arquivo')} → ${diff.after}`,
          ),
        );
        $('human-diff').append(row);
      }
      $('raw-diff').textContent = preview.raw;
      $('issues').replaceChildren(
        ...[...preview.errors, ...warnings].map((c) => node('p', issue(c))),
      );
      updateApply();
      $('preview-section').scrollIntoView({ block: 'start', behavior: 'smooth' });
    }
    if (data.type === 'error') {
      invalidate();
      $('status').textContent = data.message;
    }
    if (data.type === 'cancelled') {
      invalidate();
      $('status').textContent = t(
        'Preview cancelled. No changes applied.',
        'Preview cancelado. Nenhuma alteração aplicada.',
      );
    }
    if (data.type === 'applied') {
      invalidate();
      changes = [];
      renderChanges();
      $('status').textContent = t(
        'Applied. Existing CFG edits are undoable and remain unsaved; use Save when ready.',
        'Aplicado. Alterações em CFG existente têm undo e permanecem não salvas; salve quando estiver pronto.',
      );
    }
  });
  $('destination').onclick = () => post({ type: 'destination' });
  let timer;
  $('search').oninput = () => {
    clearTimeout(timer);
    timer = setTimeout(() => post({ type: 'search', query: $('search').value }), 100);
  };
  $('action').onchange = describe;
  $('add-form').onsubmit = (event) => {
    event.preventDefault();
    const action = actions.find((a) => a.command === $('action').value);
    if (!action) return;
    changes.push({
      key: $('key').value,
      action: {
        command: action.command,
        parameters: $('parameters').value.trim().split(/\s+/).filter(Boolean),
      },
      replace: false,
      label: action.label,
    });
    invalidate();
    renderChanges();
  };
  $('review').onclick = () => {
    invalidate();
    post({
      type: 'preview',
      changes: changes.map(({ key, action, replace }) => ({ key, action, replace })),
    });
  };
  $('cancel').onclick = () => {
    invalidate();
    post({ type: 'cancel' });
  };
  $('acknowledge').onchange = updateApply;
  $('apply').onclick = () => {
    $('apply').disabled = true;
    post({ type: 'apply', snapshot, acknowledge: $('acknowledge').checked });
  };
  $('raw-editor').onclick = () => post({ type: 'rawDiff' });
  post({ type: 'ready' });
})();
