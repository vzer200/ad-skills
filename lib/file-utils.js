const crypto = require('node:crypto');
const fs = require('node:fs');

const HASH_BUFFER_SIZE = 8 * 1024 * 1024;

function sha256File(file, options = {}) {
  const hash = crypto.createHash('sha256');
  const fd = fs.openSync(file, 'r');
  const buffer = Buffer.allocUnsafe(HASH_BUFFER_SIZE);
  const stat = fs.fstatSync(fd);
  const size = stat.size || 0;
  let done = 0;
  let nextProgress = 256 * 1024 * 1024;

  try {
    let bytesRead = 0;
    do {
      bytesRead = fs.readSync(fd, buffer, 0, buffer.length, null);
      if (bytesRead > 0) {
        hash.update(buffer.subarray(0, bytesRead));
        done += bytesRead;
        if (typeof options.onProgress === 'function' && (done >= nextProgress || done === size)) {
          options.onProgress({ done, size, file });
          nextProgress = done + 256 * 1024 * 1024;
        }
      }
    } while (bytesRead > 0);
  } finally {
    fs.closeSync(fd);
  }

  return `sha256:${hash.digest('hex')}`;
}

module.exports = {
  sha256File
};
