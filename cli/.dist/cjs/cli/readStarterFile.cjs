"use strict";
Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
const node_fs = require("node:fs");
const node_path = require("node:path");
const node_url = require("node:url");
const cli_starterDefaults = require("./starterDefaults.cjs");
var _documentCurrentScript = typeof document !== "undefined" ? document.currentScript : null;
function resolveStartersDir() {
  let dir = node_path.dirname(node_url.fileURLToPath(typeof document === "undefined" ? require("url").pathToFileURL(__filename).href : _documentCurrentScript && _documentCurrentScript.tagName.toUpperCase() === "SCRIPT" && _documentCurrentScript.src || new URL("cli/readStarterFile.cjs", document.baseURI).href));
  for (let i = 0; i < 5; i++) {
    const candidate = node_path.resolve(dir, "starters");
    if (node_fs.existsSync(candidate)) return candidate;
    dir = node_path.dirname(dir);
  }
  throw new Error("Could not locate starters directory");
}
const STARTERS_DIR = resolveStartersDir();
function readStarterTsConfig(starterPath) {
  const fullPath = node_path.resolve(STARTERS_DIR, starterPath);
  const tsconfig = JSON.parse(node_fs.readFileSync(fullPath, "utf-8"));
  delete tsconfig.compilerOptions.paths;
  return JSON.stringify(tsconfig, null, 2) + "\n";
}
function readStarterFile(starterPath, replacements) {
  const fullPath = node_path.resolve(STARTERS_DIR, starterPath);
  let content = node_fs.readFileSync(fullPath, "utf-8");
  if (replacements) {
    for (const [key, value] of Object.entries(replacements)) {
      const defaultValue = cli_starterDefaults.STARTER_DEFAULTS[key];
      if (defaultValue && defaultValue !== value) {
        content = content.replaceAll(defaultValue, value);
      }
    }
  }
  return content;
}
exports.readStarterFile = readStarterFile;
exports.readStarterTsConfig = readStarterTsConfig;
//# sourceMappingURL=readStarterFile.cjs.map
