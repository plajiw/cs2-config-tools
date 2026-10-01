const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { parse, aliases, atOffset } = require('../../dist/core/parser');
const { analyze } = require('../../dist/core/diagnostics');
const { completionContext } = require('../../dist/core/completion');
const { descriptionLanguage } = require('../../dist/core/locale');
const catalog = require('../../catalog/catalog.json');
const names = new Set(catalog.entries.map((e) => e.name));
test('both real CFGs are parsed without unknown symbols or syntax failures', () => {
  const activeNames = new Set();
  for (const file of ['autoexec.cfg', 'practice.cfg']) {
    const text = fs.readFileSync(path.join(__dirname, '../fixtures', file), 'utf8');
    const parsed = parse(text);
    assert.deepEqual(analyze(parsed, names, false), []);
    parsed.statements.forEach((s) => activeNames.add(s.tokens[0].value));
    if (file === 'practice.cfg') assert.ok(aliases(parsed).has('bots_freeze'));
  }
  for (const name of activeNames) assert.ok(names.has(name), name);
  assert.equal(names.size, catalog.entries.length, 'Catalog names are unique');
  for (const e of catalog.entries) {
    if (e.documentation.reviewed) {
      assert.ok(e.editorial.en);
      assert.ok(e.editorial['pt-BR']);
    } else {
      assert.equal(e.editorial.en, '');
      assert.ok(e.technical, 'Uncurated entries retain technical evidence');
    }
    if (e.original) assert.equal(e.original.text, e.technical.description);
  }
});
test('comments and echo text are not executable statements', () => {
  const parsed = parse('// bot_kill\r\necho "// bot_add_t; bot_kill"\n');
  assert.equal(parsed.statements.length, 1);
  assert.equal(parsed.statements[0].tokens[1].value, '// bot_add_t; bot_kill');
});
test('nested statements preserve source positions', () => {
  const text = 'bind "F8" "ent_fire smokegrenade_projectile kill; stopsound"';
  const parsed = parse(text);
  const hit = atOffset(parsed, text.indexOf('stopsound') + 2);
  assert.equal(hit.token.value, 'stopsound');
  assert.equal(text.slice(hit.token.start, hit.token.end), 'stopsound');
});
test('incomplete text recovers on the next line', () => {
  const parsed = parse('echo "unfinished\nsv_cheats 1');
  assert.equal(parsed.issues.length, 1);
  assert.ok(parsed.statements.some((s) => s.tokens[0].value === 'sv_cheats'));
});
test('rejection diagnostics require explicit evidence selection', () => {
  const parsed = parse('cl_crosshairgap -3\ncl_crosshaircolor 2');
  assert.equal(analyze(parsed, names, false).length, 0);
  assert.equal(
    analyze(
      parsed,
      names,
      new Set(
        catalog.entries.filter((entry) => entry.reportedRejection).map((entry) => entry.name),
      ),
    ).filter((f) => f.code === 'reported-rejection').length,
    2,
  );
});
test('local aliases are symbols, unknown commands remain information', () => {
  const parsed = parse('alias custom "echo hi"\ncustom\nplugin_command');
  const findings = analyze(parsed, names, false);
  assert.equal(findings.length, 1);
  assert.equal(findings[0].name, 'plugin_command');
});
test('completion resolves commands, parameters, empty bodies and nested separators', () => {
  for (const [text, offset, expected] of [
    ['bind "F2" "bot_ad"', 17, { argumentIndex: 0, prefix: 'bot_ad' }],
    ['bind "F2" ""', 11, { argumentIndex: 0, prefix: '' }],
    ['bind "F2" "bot_add_t; "', 21, { argumentIndex: 0, prefix: '' }],
    ['toggle bot_', 11, { argumentIndex: 1, prefix: 'bot_' }],
    ['sv_cheats ', 10, { argumentIndex: 1, prefix: '' }],
  ]) {
    const c = completionContext(text, parse(text), offset);
    for (const [key, value] of Object.entries(expected))
      assert.equal(c?.[key], value, `${text}: ${key}`);
  }
  assert.equal(completionContext('// bot_', parse('// bot_'), 7), undefined);
  assert.equal(completionContext('echo "bot_"', parse('echo "bot_"'), 9), undefined);
});
test('description language is independent from editor language', () => {
  assert.equal(descriptionLanguage('en', 'pt-br'), 'en');
  assert.equal(descriptionLanguage('pt-BR', 'en'), 'pt-BR');
  assert.equal(descriptionLanguage('auto', 'pt-br'), 'pt-BR');
  assert.equal(descriptionLanguage('auto', 'de'), 'en');
});
