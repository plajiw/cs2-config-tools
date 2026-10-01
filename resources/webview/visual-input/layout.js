(function (root) {
  const keys = [];
  const add = (id, label, token, x, y, width = 1, height = 1, group = 'main') =>
    keys.push({
      id,
      label,
      cs2Key: token,
      tokens: token ? [...new Set([token, token.toUpperCase()])] : [],
      x,
      y,
      width,
      height,
      group,
    });
  const row = (y, specs) => {
    let x = 0;
    for (const [label, token, width = 1] of specs) {
      add(`key-${token ?? label}`, label, token, x, y, width);
      x += width;
    }
  };
  add('key-escape', 'Esc', 'escape', 0, 0);
  for (let i = 1; i <= 12; i++)
    add(`key-f${i}`, `F${i}`, `f${i}`, 1.5 + i + Math.floor((i - 1) / 4) * 0.5, 0);
  row(1.5, [
    ['`', '`'],
    ...'1234567890'.split('').map((s) => [s, s]),
    ['-', '-'],
    ['=', '='],
    ['Backspace', 'backspace', 2],
  ]);
  row(2.5, [
    ['Tab', 'tab', 1.5],
    ...'qwertyuiop'.split('').map((s) => [s.toUpperCase(), s]),
    ['[', '['],
    [']', ']'],
    ['\\', '\\', 1.5],
  ]);
  row(3.5, [
    ['Caps Lock', 'capslock', 1.75],
    ...'asdfghjkl'.split('').map((s) => [s.toUpperCase(), s]),
    [';', ';'],
    ["'", "'"],
    ['Enter', 'enter', 2.25],
  ]);
  row(4.5, [
    ['Shift', 'shift', 2.25],
    ...'zxcvbnm'.split('').map((s) => [s.toUpperCase(), s]),
    [',', ','],
    ['.', '.'],
    ['/', '/'],
    ['Shift', 'rshift', 2.75],
  ]);
  row(5.5, [
    ['Ctrl', 'ctrl', 1.25],
    ['Win', null, 1.25],
    ['Alt', 'alt', 1.25],
    ['Space', 'space', 6.25],
    ['Alt', 'ralt', 1.25],
    ['Win R', null, 1.25],
    ['Menu', null, 1.25],
    ['Ctrl', 'rctrl', 1.25],
  ]);
  [
    ['Print', 'printscreen'],
    ['Scroll', 'scrolllock'],
    ['Pause', 'pause'],
  ].forEach(([l, t], i) => add(`key-${t}`, l, t, 16 + i, 0, 1, 1, 'navigation'));
  [
    ['Ins', 'ins'],
    ['Home', 'home'],
    ['PgUp', 'pgup'],
    ['Del', 'del'],
    ['End', 'end'],
    ['PgDn', 'pgdn'],
  ].forEach(([l, t], i) =>
    add(`key-${t}`, l, t, 16 + (i % 3), 1.5 + Math.floor(i / 3), 1, 1, 'navigation'),
  );
  add('key-up', '↑', 'uparrow', 17, 4.5, 1, 1, 'navigation');
  [
    ['←', 'leftarrow'],
    ['↓', 'downarrow'],
    ['→', 'rightarrow'],
  ].forEach(([l, t], i) => add(`key-${t}`, l, t, 16 + i, 5.5, 1, 1, 'navigation'));
  [
    ['Num', 'numlock'],
    ['/', 'kp_divide'],
    ['*', 'kp_multiply'],
    ['−', 'kp_minus'],
  ].forEach(([l, t], i) => add(`key-${t}`, l, t, 20 + i, 1.5, 1, 1, 'numpad'));
  [
    ['7', 'kp_home'],
    ['8', 'kp_uparrow'],
    ['9', 'kp_pgup'],
    ['4', 'kp_leftarrow'],
    ['5', 'kp_5'],
    ['6', 'kp_rightarrow'],
    ['1', 'kp_end'],
    ['2', 'kp_downarrow'],
    ['3', 'kp_pgdn'],
  ].forEach(([l, t], i) =>
    add(`key-${t}`, l, t, 20 + (i % 3), 2.5 + Math.floor(i / 3), 1, 1, 'numpad'),
  );
  add('key-kp-plus', '+', 'kp_plus', 23, 2.5, 1, 2, 'numpad');
  add('key-kp-enter', 'Enter', 'kp_enter', 23, 4.5, 1, 2, 'numpad');
  add('key-kp-zero', '0', 'kp_ins', 20, 5.5, 2, 1, 'numpad');
  add('key-kp-del', '.', 'kp_del', 22, 5.5, 1, 1, 'numpad');
  const mouse = [
    {
      id: 'mouse-left',
      label: 'M1',
      cs2Key: 'mouse1',
      path: 'M72 102 Q72 32 136 24 L136 130 L76 130 Z',
      x: 100,
      y: 85,
    },
    {
      id: 'mouse-right',
      label: 'M2',
      cs2Key: 'mouse2',
      path: 'M164 24 Q228 32 228 102 L224 130 L164 130 Z',
      x: 196,
      y: 85,
    },
    {
      id: 'mouse-wheel',
      label: 'M3',
      cs2Key: 'mouse3',
      path: 'M140 62 Q150 54 160 62 L160 98 Q150 106 140 98 Z',
      x: 150,
      y: 84,
    },
    {
      id: 'mouse-side-front',
      label: 'M5',
      cs2Key: 'mouse5',
      path: 'M39 104 L69 100 L69 146 L39 150 Z',
      x: 47,
      y: 126,
    },
    {
      id: 'mouse-side-back',
      label: 'M4',
      cs2Key: 'mouse4',
      path: 'M39 155 L69 151 L69 197 L39 200 Z',
      x: 47,
      y: 178,
    },
    {
      id: 'mouse-wheel-up',
      label: '↑',
      cs2Key: 'mwheelup',
      path: 'M138 29 L162 29 L162 51 L138 51 Z',
      x: 150,
      y: 41,
    },
    {
      id: 'mouse-wheel-down',
      label: '↓',
      cs2Key: 'mwheeldown',
      path: 'M138 111 L162 111 L162 133 L138 133 Z',
      x: 150,
      y: 123,
    },
  ].map((d) => ({ ...d, tokens: [d.cs2Key, d.cs2Key.toUpperCase()], group: 'mouse' }));
  const api = {
    keys,
    mouse,
    matches: (definition, entries) =>
      entries.filter((entry) => definition.tokens.includes(entry.key)),
  };
  if (typeof module !== 'undefined') module.exports = api;
  else root.CS2InputLayout = api;
})(typeof window !== 'undefined' ? window : globalThis);
