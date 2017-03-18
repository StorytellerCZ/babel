var assert = require("assert");
var getDefaultOptions = require("./options.js").getDefaults;
var getMinifierOptions = require("./options.js").getMinifierDefaults;
var Cache = require("./cache.js");
var compileCache; // Lazily initialized.

// Make sure that module.import and module.export are defined in the
// current Node process.
require("reify/node/runtime");

// Options passed to compile will completely replace the default options,
// so if you only want to modify the default options, call this function
// first, modify the result, and then pass those options to compile.
exports.getDefaultOptions = getDefaultOptions;
exports.getMinifierOptions = getMinifierOptions;

var parse = exports.parse =
  require("reify/lib/parsers/babylon.js").parse;

exports.compile = function compile(source, options, deps) {
  options = options || getDefaultOptions();
  if (! compileCache) {
    setCacheDir();
  }
  return compileCache.get(source, options, deps);
};

function compile(source, options) {
  var ast = parse(source);

  // Since Reify inserts code without updating ast.tokens, it's better to
  // destroy unreliable token information. Don't worry; Babel can cope.
  delete ast.tokens;

  return require("babel-core")
    .transformFromAst(ast, source, options);
}

exports.minify = function minify(source, options) {
  // We are not compiling the code in this step, only minifying, so reify
  // is not used.
  return require("babel-core").transformFromAst(
    parse(source),
    source,
    options || getMinifierOptions()
  );
}

function setCacheDir(cacheDir) {
  if (! (compileCache && compileCache.dir === cacheDir)) {
    compileCache = new Cache(compile, cacheDir);
  }
}
exports.setCacheDir = setCacheDir;

exports.runtime = // Legacy name; prefer installRuntime.
exports.installRuntime = function installRuntime() {
  return require("./runtime.js");
};

exports.defineHelpers = function defineHelpers() {
  return require("meteor-babel-helpers");
};
