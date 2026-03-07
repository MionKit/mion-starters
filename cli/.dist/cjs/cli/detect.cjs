"use strict";
Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
const node_fs = require("node:fs");
const node_path = require("node:path");
const NEXTJS_CONFIGS = ["next.config.js", "next.config.ts", "next.config.mjs"];
const NUXT_CONFIGS = ["nuxt.config.js", "nuxt.config.ts", "nuxt.config.mjs"];
function detectFramework(cwd) {
  const projectName = readProjectName(cwd);
  for (const config of NEXTJS_CONFIGS) {
    if (node_fs.existsSync(node_path.join(cwd, config))) {
      return { framework: "nextjs", name: projectName, configFile: config };
    }
  }
  for (const config of NUXT_CONFIGS) {
    if (node_fs.existsSync(node_path.join(cwd, config))) {
      return { framework: "nuxt", name: projectName, configFile: config };
    }
  }
  return null;
}
function readProjectName(cwd) {
  try {
    const pkg = JSON.parse(node_fs.readFileSync(node_path.join(cwd, "package.json"), "utf-8"));
    return pkg.name || "my-app";
  } catch {
    return "my-app";
  }
}
exports.detectFramework = detectFramework;
//# sourceMappingURL=detect.cjs.map
