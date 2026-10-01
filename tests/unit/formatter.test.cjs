const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { formatCfg } = require('../../dist/core/formatter');
const { parse } = require('../../dist/core/parser');

const commands = (text) =>
  parse(text).statements.map((statement) => ({
    context: statement.context,
    tokens: statement.tokens.map((token) => ({ value: token.value, quoted: token.quoted })),
  }));

test('spacing, comments, separators and blank lines', () => {
  const input = '  sensitivity\t  "1.40"   // mouse\n\n\n\n  rate   1000000;fps_max   "0"  \n';
  assert.equal(formatCfg(input), 'sensitivity "1.40"  // mouse\n\nrate 1000000; fps_max "0"\n');
});

test('literal strings, echo content and deferred command bodies remain intact', () => {
  const input =
    ' bind   "F2"   "buy  m4a1;buy ak47; echo  hello // literal"\n echo    hello    world\n';
  const result = formatCfg(input);
  assert.ok(result.includes('"buy  m4a1;buy ak47; echo  hello // literal"'));
  assert.ok(result.includes('echo    hello    world'));
  assert.deepEqual(commands(result), commands(input));
});

test('repeated formatting is idempotent and preserves both fixture command streams', () => {
  for (const name of ['autoexec.cfg', 'practice.cfg']) {
    const text = fs.readFileSync(path.join(__dirname, '../fixtures', name), 'utf8');
    const result = formatCfg(text);
    assert.equal(formatCfg(result), result);
    assert.deepEqual(commands(result), commands(text));
  }
});

test('malformed quoted strings are not repaired', () => {
  for (const text of [' bind "F2" "unfinished\nrate 1', 'echo "multiline\ntext"']) {
    assert.equal(formatCfg(text), text);
  }
});

test('CRLF, BOM and final newline are handled without changing literals', () => {
  assert.equal(formatCfg('\uFEFFrate   "1"\r\n\r\n'), '\uFEFFrate "1"\r\n');
  assert.equal(formatCfg('rate   1', { insertFinalNewline: false }), 'rate 1');
  assert.equal(formatCfg('rate 1\n\n\nfps_max 0', { maxBlankLines: 0 }), 'rate 1\nfps_max 0\n');
  assert.equal(formatCfg(''), '');
  assert.equal(formatCfg(' \n\t\n'), '');
});

test('section separation is configurable and comment text survives', () => {
  const text = 'rate 1\n// === NETWORK ===\n// Keep   this  wording\nfps_max 0';
  assert.equal(
    formatCfg(text),
    'rate 1\n\n// === NETWORK ===\n// Keep   this  wording\nfps_max 0\n',
  );
  assert.equal(formatCfg(text, { separateSections: false }), text + '\n');
});

test('semicolon edge cases keep statement order and literal values', () => {
  for (const text of [
    'rate 1 ;; fps_max 0;',
    'custom "a;b//c";rate 1 // note',
    'alias "x" "echo hi;rate 1"',
    'custom "a""b"',
  ]) {
    const result = formatCfg(text);
    assert.deepEqual(commands(result), commands(text));
    assert.equal(formatCfg(result), result);
  }
});
