const fs = require('fs');
const path = require('path');

const readdir = promisify(fs.readdir);
const stat = promisify(fs.stat);

/**
 * 简单实现一个promisify
 */
function promisify(fn) {
  return () => {
    const args = arguments;
    return new Promise((resolve, reject) => {
      [].push.call(args, (err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(result);
        }
      });
      fn.apply(null, args);
    });
  };
}
function readDirRecur(file, callback) {
  return readdir(file).then(files => {
    const newFiles = files.map(item => {
      const fullPath = path.join(file, item);
      return stat(fullPath).then(stats => {
        if (stats.isDirectory()) {
          return readDirRecur(fullPath, callback);
        }
        return callback(fullPath);
      });
    });
    return Promise.all(newFiles);
  });
}

export default readDirRecur;
