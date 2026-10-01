const { test } = require('node:test');
const assert = require('node:assert/strict');
const layout = require('../../resources/webview/visual-input/layout');
const state = require('../../resources/webview/visual-input/state');

test('ANSI geometry has unique IDs, proportional keys and nonoverlapping clusters', () => {
  assert.equal(layout.keys.length, 104);
  assert.equal(new Set(layout.keys.map((key) => key.id)).size, layout.keys.length);
  const key = (token) => layout.keys.find((key) => key.cs2Key === token);
  assert.equal(key('space').width, 6.25);
  assert.equal(key('tab').width, 1.5);
  assert.equal(key('enter').width, 2.25);
  assert.equal(key('kp_enter').height, 2);
  assert.equal(key('kp_plus').height, 2);
  assert.equal(key('kp_ins').width, 2);
  assert.ok(key('kp_home').x > key('home').x);
  assert.ok(key('home').x > key('backspace').x);
  for (const a of layout.keys) {
    assert.ok(a.width > 0 && a.height > 0);
    for (const b of layout.keys)
      if (a !== b)
        assert.ok(
          a.x + a.width <= b.x ||
            b.x + b.width <= a.x ||
            a.y + a.height <= b.y ||
            b.y + b.height <= a.y,
          `${a.id} overlaps ${b.id}`,
        );
  }
});

test('mouse regions and literal key matching preserve ambiguity without normalizing data', () => {
  assert.equal(layout.mouse.length, 7);
  assert.deepEqual(layout.mouse.map((def) => def.cs2Key).sort(), [
    'mouse1',
    'mouse2',
    'mouse3',
    'mouse4',
    'mouse5',
    'mwheeldown',
    'mwheelup',
  ]);
  const q = layout.keys.find((key) => key.cs2Key === 'q');
  const entries = [
    { key: 'q', action: 'slot1' },
    { key: 'Q', action: 'slot2' },
    { key: 'Custom', action: 'custom' },
  ];
  assert.deepEqual(layout.matches(q, entries), entries.slice(0, 2));
  assert.deepEqual(state.select(q, layout.matches(q, entries)), {
    key: 'q',
    visualId: q.id,
    ambiguous: true,
  });
  assert.deepEqual(state.select(q, []), { key: undefined, visualId: q.id, ambiguous: false });
  assert.equal(entries[1].key, 'Q');
});

test('presentation filters distinguish missing data, uncertainty and reassignment', () => {
  const entry = { category: 'movement', certain: false };
  assert.equal(state.matchesFilters(entry, false, 'movement', 'uncertain'), true);
  assert.equal(state.matchesFilters(entry, false, 'weapons', 'all'), false);
  assert.equal(state.matchesFilters(undefined, false, 'all', 'idle'), true);
  assert.equal(state.matchesFilters(undefined, false, 'all', 'assigned'), false);
  assert.equal(state.matchesFilters(entry, true, 'all', 'conflict'), true);
  assert.equal(state.matchesFilters(entry, false, 'all', 'conflict'), false);
});
