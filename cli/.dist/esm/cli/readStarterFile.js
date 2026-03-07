import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { STARTER_DEFAULTS } from "./starterDefaults.js";
function resolveStartersDir() {
  let dir = dirname(fileURLToPath(import.meta.url));
  for (let i = 0; i < 5; i++) {
    const candidate = resolve(dir, "starters");
    if (existsSync(candidate)) return candidate;
    dir = dirname(dir);
  }
  throw new Error("Could not locate starters directory");
}
const STARTERS_DIR = resolveStartersDir();
function readStarterTsConfig(starterPath) {
  const fullPath = resolve(STARTERS_DIR, starterPath);
  const tsconfig = JSON.parse(readFileSync(fullPath, "utf-8"));
  delete tsconfig.compilerOptions.paths;
  return JSON.stringify(tsconfig, null, 2) + "\n";
}
function readStarterFile(starterPath, replacements) {
  const fullPath = resolve(STARTERS_DIR, starterPath);
  let content = readFileSync(fullPath, "utf-8");
  if (replacements) {
    for (const [key, value] of Object.entries(replacements)) {
      const defaultValue = STARTER_DEFAULTS[key];
      if (defaultValue && defaultValue !== value) {
        content = content.replaceAll(defaultValue, value);
      }
    }
  }
  return content;
}
export {
  readStarterFile,
  readStarterTsConfig
};
//# sourceMappingURL=readStarterFile.js.map
