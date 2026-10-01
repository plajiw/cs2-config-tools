/* global CS2InputLayout */
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
          d: 'M72 100 Q72 18 150 18 Q228 18 228 100 L238 218 Q234 292 150 296 Q66 292 62 218 Z',
          class: 'device-shell',
        }),
      );
    else
      svg.append(
        node('rect', { x: -6, y: -6, width: 1070, height: 310, rx: 14, class: 'device-shell' }),
      );
    const elements = new Map();
    for (const def of definitions) {
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
      const marker = node('text', {
        x: mouse ? def.x + 18 : def.x * 44 + def.width * 44 - 10,
        y: mouse ? def.y - 12 : def.y * 44 + 10,
        'text-anchor': 'end',
        class: 'state-marker',
      });
      group.append(marker);
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
      elements.set(def.id, { group, marker, title });
      svg.append(group);
    }
    return {
      svg,
      update(entries, selectedId, filter, labels) {
        for (const def of definitions) {
          const { group, marker, title } = elements.get(def.id);
          const matches = CS2InputLayout.matches(def, entries),
            entry = matches[0];
          const conflict = matches.length > 1 || matches.some((e) => e.conflict);
          const uncertain = matches.some((e) => !e.certain);
          const selected = selectedId === def.id;
          const dim = matches.length
            ? !matches.some((candidate) => filter(candidate, conflict))
            : !filter(undefined, false);
          group.setAttribute('data-category', entry?.category ?? 'custom');
          group.setAttribute(
            'class',
            `input-key ${entry ? 'assigned' : 'idle'} ${conflict ? 'conflict' : ''} ${uncertain ? 'uncertain' : ''} ${selected ? 'selected' : ''} ${dim ? 'muted' : ''}`,
          );
          marker.textContent = conflict ? '!' : uncertain ? '?' : entry ? '•' : '';
          group.setAttribute('aria-pressed', String(selected));
          const description = `${def.label} · ${entry ? entry.action : labels.empty}${conflict ? ` · ${labels.conflict}` : ''}${uncertain ? ` · ${labels.uncertain}` : ''}`;
          group.setAttribute('aria-label', description);
          title.textContent = description;
        }
      },
    };
  }
  root.CS2InputSvg = {
    keyboard: (callbacks) => surface(CS2InputLayout.keys, '-10 -10 1080 320', callbacks, false),
    mouse: (callbacks) => surface(CS2InputLayout.mouse, '25 0 225 315', callbacks, true),
  };
})(window);
