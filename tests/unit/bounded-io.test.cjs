const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { readUtf8FileBounded } = require('../../dist/vscode/bounded-read');

test('bounded disk reads reject oversize before opening/allocation and preserve UTF-8 source', async () => {
  const folder = fs.mkdtempSync(path.join(os.tmpdir(), 'cs2-bounded-'));
  const file = path.join(folder, 'test.cfg');
  const open = fs.promises.open;
  try {
    fs.writeFileSync(file, 'x'.repeat(1025));
    let opened = 0;
    fs.promises.open = async (...args) => {
      opened++;
      return open(...args);
    };
    await assert.rejects(readUtf8FileBounded(file, 1024), { code: 'TOO_LARGE' });
    assert.equal(opened, 0, 'Oversized metadata fails before file open or read buffer allocation');
    fs.promises.open = open;
    const text = '\uFEFF// comentário\r\nbind "x" "slot8"\r\n';
    fs.writeFileSync(file, text);
    assert.equal(await readUtf8FileBounded(file, 1024), text);
    fs.writeFileSync(file, Buffer.from([0xff, 0xfe, 0x41, 0]));
    await assert.rejects(readUtf8FileBounded(file, 1024), { code: 'INVALID_ENCODING' });
    await assert.rejects(readUtf8FileBounded(folder, 1024), { code: 'NOT_REGULAR_FILE' });
    await assert.rejects(readUtf8FileBounded(path.join(folder, 'missing'), 1024), {
      code: 'NOT_FOUND',
    });
    fs.writeFileSync(file, 'unchanged');
    fs.promises.open = async (...args) => {
      const handle = await open(...args);
      fs.writeFileSync(file, 'changed source');
      return handle;
    };
    await assert.rejects(readUtf8FileBounded(file, 1024), { code: 'SOURCE_CHANGED' });
  } finally {
    fs.promises.open = open;
    fs.unlinkSync(file);
    fs.rmdirSync(folder);
  }
});
