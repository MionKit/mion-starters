import { existsSync, mkdirSync, writeFileSync, readFileSync } from "node:fs";
import { join, dirname } from "node:path";
function writeFile(filePath, content) {
  const dir = dirname(filePath);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  writeFileSync(filePath, content, "utf-8");
}
function writeFiles(cwd, files) {
  for (const file of files) {
    const fullPath = join(cwd, file.path);
    writeFile(fullPath, file.content);
    console.log(`  created ${file.path}`);
  }
}
function readJson(filePath) {
  return JSON.parse(readFileSync(filePath, "utf-8"));
}
function writeJson(filePath, data) {
  writeFile(filePath, JSON.stringify(data, null, 2) + "\n");
}
export {
  readJson,
  writeFile,
  writeFiles,
  writeJson
};
//# sourceMappingURL=fileGenerator.js.map
