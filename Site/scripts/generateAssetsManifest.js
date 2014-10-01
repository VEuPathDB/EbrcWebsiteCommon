/*
 * This script will compute an MD5 checksum for each file argument
 * and generate JSON output of the following form:
 *
 * {
 *    "files" : {
 *        "path/as/entered/to/app.js": {
 *            "checksum": "56398e76be6355ad5999b262208a17c9",
 *            "size": "82739"
 *        },
 *        ...
 *    }
 * }
 */

var fs = require('fs');
var MD5 = require('MD5');

var files = process.argv.slice(2);

if (!files.length) {
  usage();
  process.exit();
}

var manifest = {};

manifest.files = files
  .reduce(function(acc, file) {
    acc[file] = {
      checksum: MD5(fs.readFileSync(file)),
      size: fs.statSync(file).size
    };
    return acc;
  }, {});

process.stdout.write(JSON.stringify(manifest, null, 4) + '\n', 'utf-8');
process.exit();

function usage() {
  process.stdout.write('Usage:  node generateAssetsManifest.js [file, ]\n');
}
