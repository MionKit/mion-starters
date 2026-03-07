"use strict";
Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
const node_fs = require("node:fs");
const node_path = require("node:path");
function writeFile(filePath, content) {
  const dir = node_path.dirname(filePath);
  if (!node_fs.existsSync(dir)) node_fs.mkdirSync(dir, { recursive: true });
  node_fs.writeFileSync(filePath, content, "utf-8");
}
function writeFiles(cwd, files) {
  for (const file of files) {
    const fullPath = node_path.join(cwd, file.path);
    writeFile(fullPath, file.content);
    console.log(`  created ${file.path}`);
  }
}
function readJson(filePath) {
  return JSON.parse(node_fs.readFileSync(filePath, "utf-8"));
}
function writeJson(filePath, data) {
  writeFile(filePath, JSON.stringify(data, null, 2) + "\n");
}
exports.readJson = readJson;
exports.writeFile = writeFile;
exports.writeFiles = writeFiles;
exports.writeJson = writeJson;
//# sourceMappingURL=fileGenerator.cjs.map
