"use strict";
Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
const node_path = require("node:path");
const node_fs = require("node:fs");
const cli_detect = require("./detect.cjs");
const cli_prompts = require("./prompts.cjs");
const cli_fileGenerator = require("./fileGenerator.cjs");
const cli_generators_shared_apiPackageJson = require("./generators/shared/apiPackageJson.cjs");
const cli_generators_nextjs_rootScripts = require("./generators/nextjs/rootScripts.cjs");
const cli_readStarterFile = require("./readStarterFile.cjs");
const SERVER_FILES = {
  "vercel-serverless": "nextjs-16/mion-app/api/src/vercel-serverless.ts",
  "standalone-node": "nextjs-16/mion-app/api/src/server.node.ts",
  "standalone-bun": "nextjs-16/mion-app/api/src/server.bun.ts"
};
async function init(cwd, providedOptions) {
  console.log("\n@mionkit/starter — Scaffold mion API\n");
  const project = cli_detect.detectFramework(cwd);
  if (!project) {
    throw new Error(
      "Could not detect a supported meta-framework in this directory.\nSupported: Next.js (next.config.{js,ts,mjs})\n\nMake sure you run this command from your project root."
    );
  }
  console.log(`Detected: ${project.framework} (${project.configFile})`);
  console.log(`Project: ${project.name}`);
  if (node_fs.existsSync(node_path.join(cwd, "api"))) {
    throw new Error("An api/ directory already exists. Aborting to avoid overwriting files.");
  }
  const options = providedOptions || await cli_prompts.promptInitOptions();
  const routerPrefix = options.basePath.replace(/^\//, "");
  const apiWorkspaceName = `@${project.name}/api`;
  const files = [];
  let rootScripts = {};
  if (project.framework === "nextjs") {
    files.push(
      {
        path: "api/package.json",
        content: cli_generators_shared_apiPackageJson.generateApiPackageJson({ projectName: project.name, deployTarget: options.deployTarget })
      },
      { path: "api/tsconfig.json", content: cli_readStarterFile.readStarterTsConfig("nextjs-16/mion-app/api/tsconfig.json") },
      { path: "api/vite.config.ts", content: cli_readStarterFile.readStarterFile("nextjs-16/mion-app/api/vite.config.ts", { SERVER_ENTRY: "server.ts" }) }
    );
    if (options.withExample) {
      files.push(
        { path: "api/src/api.ts", content: cli_readStarterFile.readStarterFile("nextjs-16/mion-app/api/src/api.ts", { PREFIX: routerPrefix }) },
        { path: "api/src/handlers/orders.ts", content: cli_readStarterFile.readStarterFile("nextjs-16/mion-app/api/src/handlers/orders.ts") },
        {
          path: "app/orders/page.tsx",
          content: cli_readStarterFile.readStarterFile("nextjs-16/mion-app/app/orders/page.tsx", {
            PREFIX: routerPrefix,
            API_WORKSPACE: apiWorkspaceName
          })
        }
      );
    } else {
      files.push({ path: "api/src/api.ts", content: generateMinimalApi(routerPrefix) });
    }
    const serverReplacements = options.deployTarget === "vercel-serverless" ? { BASE_PATH: options.basePath } : void 0;
    files.push({
      path: "api/src/server.ts",
      content: cli_readStarterFile.readStarterFile(SERVER_FILES[options.deployTarget], serverReplacements)
    });
    if (options.deployTarget === "vercel-serverless") {
      const catchAllDir = getCatchAllDir(cwd);
      files.push({
        path: `${catchAllDir}/route.ts`,
        content: cli_readStarterFile.readStarterFile("nextjs-16/mion-app/app/api/[...mion]/route.ts", { API_WORKSPACE: apiWorkspaceName })
      });
    }
    rootScripts = cli_generators_nextjs_rootScripts.getNextjsRootScripts(apiWorkspaceName);
  } else {
    throw new Error(`Framework "${project.framework}" is not yet supported. Only Next.js is currently available.`);
  }
  console.log("\nCreating files:");
  cli_fileGenerator.writeFiles(cwd, files);
  console.log("\nUpdating root package.json:");
  const rootDependencies = { "@mionkit/client": "^0.7.2" };
  updateRootPackageJson(cwd, rootScripts, rootDependencies);
  printInstructions(options.deployTarget);
}
function getCatchAllDir(cwd) {
  if (node_fs.existsSync(node_path.join(cwd, "src/app"))) return "src/app/api/[...mion]";
  if (node_fs.existsSync(node_path.join(cwd, "app"))) return "app/api/[...mion]";
  return "src/app/api/[...mion]";
}
function updateRootPackageJson(cwd, scripts, dependencies) {
  const pkgPath = node_path.join(cwd, "package.json");
  const pkg = cli_fileGenerator.readJson(pkgPath);
  const workspaces = pkg.workspaces || [];
  if (!workspaces.includes("api")) {
    workspaces.push("api");
    pkg.workspaces = workspaces;
    console.log('  added workspaces: ["api"]');
  }
  const existingDeps = pkg.dependencies || {};
  for (const [name, version] of Object.entries(dependencies)) {
    existingDeps[name] = version;
    console.log(`  added dependency "${name}": "${version}"`);
  }
  pkg.dependencies = existingDeps;
  const existingScripts = pkg.scripts || {};
  for (const [name, command] of Object.entries(scripts)) {
    existingScripts[`mion:${name}`] = command;
    console.log(`  added script "mion:${name}"`);
  }
  pkg.scripts = existingScripts;
  cli_fileGenerator.writeJson(pkgPath, pkg);
}
function generateMinimalApi(prefix) {
  return [
    `import {initMionRouter, route, Routes} from '@mionkit/router';`,
    ``,
    `const routes = {`,
    `    hello: route((ctx, name: string): string => \`Hello \${name}!\`),`,
    `    getTime: route((ctx): Date => new Date()),`,
    `} satisfies Routes;`,
    ``,
    `export const myApi = await initMionRouter(routes, {prefix: '${prefix}'});`,
    `export type MyApi = typeof myApi;`,
    ``
  ].join("\n");
}
function printInstructions(deployTarget) {
  console.log(`
Done! Next steps:

  1. Install dependencies:
     npm install

  2. Start development:
     npm run mion:dev

  3. Build for production:
     npm run mion:build
`);
  if (deployTarget === "vercel-serverless") {
    console.log(`  Vercel build command: npm run mion:build`);
    console.log(`  The catch-all route at src/app/api/[...mion]/route.ts`);
    console.log(`  imports the pre-built mion API output.
`);
  }
}
exports.init = init;
//# sourceMappingURL=init.cjs.map
