/* global CS2InputLayout, CS2InputState */
(function (root) {
  const ns = 'http://www.w3.org/2000/svg';
  const node = (tag, attributes = {}, text) => {
    const el = document.createElementNS(ns, tag);
    for (const [key, value] of Object.entries(attributes)) el.setAttribute(key, String(value));
    if (text !== undefined) el.textContent = text;
    return el;
  };
  function surface(definitions, viewBox, callbacks, mouse) {
    const svg = node('svg', {
      viewBox,
      preserveAspectRatio: 'xMidYMid meet',
      role: 'group',
      'aria-label': mouse ? 'Mouse' : 'Keyboard ANSI',
    });
    if (mouse)
      svg.append(
        node('path', {
          d: 'M130 18 C72 18 48 57 44 116 C38 157 34 213 50 253 C65 291 107 305 139 298 C183 292 212 267 224 229 C236 187 222 148 217 111 C211 49 184 18 130 18 Z',
          class: 'device-shell',
        }),
      );
    else
      svg.append(
        node('rect', { x: -6, y: -6, width: 1070, height: 310, rx: 14, class: 'device-shell' }),
      );
    const elements = new Map();
    for (const def of definitions.filter((def) => !def.external)) {
      const group = node('g', {
        class: 'input-key',
        tabindex: 0,
        role: 'button',
        'data-key': def.cs2Key ?? def.id,
        'data-visual-id': def.id,
        'aria-label': def.label,
      });
      group.dataset.focusId = `visual:${def.id}`;
      if (mouse) group.append(node('path', { d: def.path, class: 'key-face' }));
      else
        group.append(
          node('rect', {
            x: def.x * 44,
            y: def.y * 44,
            width: def.width * 44 - 4,
            height: def.height * 44 - 4,
            rx: 4,
            class: 'key-face',
          }),
        );
      group.append(
        node(
          'text',
          {
            x: mouse ? def.x : def.x * 44 + (def.width * 44 - 4) / 2,
            y: mouse ? def.y : def.y * 44 + 22,
            'text-anchor': 'middle',
            'dominant-baseline': 'middle',
            class: 'key-label',
          },
          def.label,
        ),
      );
      const marker = node('circle', {
        cx: mouse ? (def.markerX ?? def.x + 14) : def.x * 44 + def.width * 44 - 9,
        cy: mouse ? (def.markerY ?? def.y - 15) : def.y * 44 + 8,
        r: 2.5,
        class: 'state-marker',
      });
      const indicator = node('text', {
        x: mouse ? (def.markerX ?? def.x + 14) - 8 : def.x * 44 + def.width * 44 - 16,
        y: mouse ? (def.markerY ?? def.y - 15) + 3 : def.y * 44 + 11,
        'text-anchor': 'end',
        class: 'status-marker',
      });
      group.append(marker, indicator);
      const title = node('title');
      group.append(title);
      group.addEventListener('click', () => callbacks.select(def));
      group.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          callbacks.select(def);
        }
        if (event.key === 'Escape') callbacks.hideTooltip();
      });
      group.addEventListener('mouseenter', () => callbacks.tooltip(def, group));
      group.addEventListener('focus', () => callbacks.tooltip(def, group));
      group.addEventListener('mouseleave', callbacks.hideTooltip);
      group.addEventListener('blur', callbacks.hideTooltip);
      elements.set(def.id, { group, marker, indicator, title });
      svg.append(group);
    }
    return {
      svg,
      update(entries, selectedId, filter, labels) {
        for (const def of definitions.filter((def) => !def.external)) {
          const { group, marker, indicator, title } = elements.get(def.id);
          const { entry, conflict, uncertain, selected, dim } = CS2InputState.presentation(
            CS2InputLayout.matches(def, entries),
            selectedId === def.id,
            filter,
          );
          group.setAttribute('data-category', entry?.category ?? 'custom');
          group.setAttribute(
            'class',
            `input-key ${entry ? 'assigned' : 'idle'} ${conflict ? 'conflict' : ''} ${uncertain ? 'uncertain' : ''} ${selected ? 'selected' : ''} ${dim ? 'muted' : ''}`,
          );
          marker.style.display = entry ? '' : 'none';
          indicator.textContent = conflict ? '!' : '';
          group.setAttribute('aria-pressed', String(selected));
          const description = `${def.cs2Key ?? def.label} · ${entry ? entry.action : labels.empty}${conflict ? ` · ${labels.conflict}` : ''}${uncertain ? ` · ${labels.uncertain}` : ''}`;
          group.setAttribute('aria-label', description);
          title.textContent = description;
        }
      },
    };
  }
  function controls(definitions, callbacks) {
    const elements = definitions.map((def) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.dataset.focusId = 'control:' + def.id;
      button.dataset.key = def.cs2Key;
      const key = document.createElement('kbd');
      key.textContent = def.label;
      const label = document.createElement('span');
      label.className = 'control-label';
      const meaning = document.createElement('span');
      meaning.className = 'control-meaning';
      const text = document.createElement('span');
      text.className = 'control-copy';
      text.append(label, meaning);
      const marker = document.createElement('span');
      marker.className = 'state-marker';
      marker.setAttribute('aria-hidden', 'true');
      button.append(key, text, marker);
      button.addEventListener('click', () => callbacks.select(def));
      button.addEventListener('mouseenter', () => callbacks.tooltip(def, button));
      button.addEventListener('mouseleave', callbacks.hideTooltip);
      button.addEventListener('focus', () => callbacks.tooltip(def, button));
      button.addEventListener('blur', callbacks.hideTooltip);
      return { def, button, label, meaning, marker };
    });
    return {
      nodes: elements.map((item) => item.button),
      update(entries, selectedId, filter, labels) {
        for (const { def, button, label, meaning, marker } of elements) {
          const { entry, conflict, uncertain, selected, dim } = CS2InputState.presentation(
            CS2InputLayout.matches(def, entries),
            selectedId === def.id,
            filter,
          );
          button.className = `mouse-action ${entry ? 'assigned' : 'idle'} ${conflict ? 'conflict' : ''} ${uncertain ? 'uncertain' : ''} ${selected ? 'selected' : ''} ${dim ? 'muted' : ''}`;
          button.dataset.category = entry?.category ?? 'custom';
          label.textContent = labels.names[def.cs2Key];
          meaning.textContent = entry ? (entry.meaning ?? entry.action) : labels.empty;
          meaning.title = meaning.textContent;
          marker.style.visibility = entry ? 'visible' : 'hidden';
          button.setAttribute('aria-pressed', String(selected));
          button.setAttribute(
            'aria-label',
            labels.names[def.cs2Key] +
              ' · ' +
              (entry ? (entry.meaning ?? entry.action) : labels.empty) +
              (conflict ? ' · ' + labels.conflict : '') +
              (uncertain ? ' · ' + labels.uncertain : ''),
          );
        }
      },
    };
  }
  root.CS2InputSvg = {
    controls,
    keyboard: (callbacks) => surface(CS2InputLayout.keys, '-10 -10 1080 320', callbacks, false),
    mouse: (callbacks) => surface(CS2InputLayout.mouse, '0 0 260 320', callbacks, true),
  };
})(window);
