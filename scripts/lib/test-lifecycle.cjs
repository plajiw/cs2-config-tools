const fs = require('node:fs');
const path = require('node:path');

// Remove only a generated, owned synthetic directory; preserve the primary failure.
async function cleanupOwned(directory, root, primaryFailure) {
  try {
    const resolved = fs.realpathSync(directory),
      parent = fs.realpathSync(root);
    const relative = path.relative(parent, resolved);
    if (!relative || relative.startsWith('..') || path.isAbsolute(relative))
      throw new Error('Test cleanup target is outside its owned run');
    await fs.promises.rm(resolved, {
      recursive: true,
      force: false,
      maxRetries: 10,
      retryDelay: 100,
    });
  } catch (error) {
    console.error('CLEANUP FAILURE:', error);
    if (!primaryFailure) throw error;
  }
}

async function browserPort(file, child, read = fs.readFileSync) {
  for (let attempt = 0; attempt < 100; attempt++) {
    if (child.exitCode !== null) throw new Error(`Browser exited: ${child.exitCode}`);
    try {
      const port = Number(read(file, 'utf8').split('\n')[0]);
      if (Number.isInteger(port) && port > 0 && port < 65536) return port;
    } catch (error) {
      if (!['ENOENT', 'EBUSY', 'EPERM'].includes(error.code)) throw error;
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error('Browser debugging port unavailable after bounded startup wait');
}
module.exports = { cleanupOwned, browserPort };
