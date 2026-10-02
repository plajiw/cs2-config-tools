const { test } = require('node:test');
const assert = require('node:assert/strict');
const catalog = require('../../catalog/catalog.json');
const { parse } = require('../../dist/core/parser');
const { analyze } = require('../../dist/core/diagnostics');
const { documentation } = require('../../dist/core/documentation');
test('default scoreboard and analog binds are recognized and document their pinned source', () => {
  const text =
    'bind "TAB" "+showscores" // Show scoreboard\nbind "MOUSE_X" "yaw"\nbind "MOUSE_Y" "pitch"';
  assert.deepEqual(analyze(parse(text), new Set(catalog.entries.map((e) => e.name)), false), []);
  for (const name of ['+showscores', 'yaw', 'pitch']) {
    const entry = catalog.entries.find((e) => e.name === name);
    assert.equal(entry.parameter, undefined);
    assert.equal(entry.runtime, undefined);
    assert.equal(entry.original, null);
    assert.equal(entry.lifecycle, 'unknown');
    assert.ok(entry.documentationSource.url.includes('c3b892a3363a9b0275fc901f1960acac9f10b26b'));
    for (const language of ['en', 'pt-BR']) {
      const blocks = documentation(entry, { language });
      assert.ok(blocks.some((b) => b.kind === 'text' && b.text === entry.editorial[language]));
      assert.ok(blocks.some((b) => b.kind === 'link' && b.url === entry.documentationSource.url));
    }
  }
  assert.ok(
    analyze(
      parse('bind "o" "unknown_example_action"'),
      new Set(catalog.entries.map((e) => e.name)),
      false,
    ).some((f) => f.code === 'unknown'),
  );
});
