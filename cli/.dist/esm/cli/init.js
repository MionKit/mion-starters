import { join } from "node:path";
import { existsSync } from "node:fs";
import { detectFramework } from "./detect.js";
import { promptInitOptions } from "./prompts.js";
import { writeFiles, readJson, writeJson } from "./fileGenerator.js";
import { generateApiPackageJson } from "./generators/shared/apiPackageJson.js";
import { getNextjsRootScripts } from "./generators/nextjs/rootScripts.js";
import { readStarterTsConfig, readStarterFile } from "./readStarterFile.js";
const SERVER_FILES = {
  "vercel-serverless": "nextjs-16/mion-app/api/src/vercel-serverless.ts",
  "standalone-node": "nextjs-16/mion-app/api/src/server.node.ts",
  "standalone-bun": "nextjs-16/mion-app/api/src/server.bun.ts"
};
async function init(cwd, providedOptions) {
  console.log("\n@mionkit/starter — Scaffold mion API\n");
  const project = detectFramework(cwd);
  if (!project) {
    throw new Error(
      "Could not detect a supported meta-framework in this directory.\nSupported: Next.js (next.config.{js,ts,mjs})\n\nMake sure you run this command from your project root."
    );
  }
  console.log(`Detected: ${project.framework} (${project.configFile})`);
  console.log(`Project: ${project.name}`);
  if (existsSync(join(cwd, "api"))) {
    throw new Error("An api/ directory already exists. Aborting to avoid overwriting files.");
  }
  const options = providedOptions || await promptInitOptions();
  const routerPrefix = options.basePath.replace(/^\//, "");
  const apiWorkspaceName = `@${project.name}/api`;
  const files = [];
  let rootScripts = {};
  if (project.framework === "nextjs") {
    files.push(
      {
        path: "api/package.json",
        content: generateApiPackageJson({ projectName: project.name, deployTarget: options.deployTarget })
      },
      { path: "api/tsconfig.json", content: readStarterTsConfig("nextjs-16/mion-app/api/tsconfig.json") },
      { path: "api/vite.config.ts", content: readStarterFile("nextjs-16/mion-app/api/vite.config.ts", { SERVER_ENTRY: "server.ts" }) }
    );
    if (options.withExample) {
      files.push(
        { path: "api/src/api.ts", content: readStarterFile("nextjs-16/mion-app/api/src/api.ts", { PREFIX: routerPrefix }) },
        { path: "api/src/handlers/orders.ts", content: readStarterFile("nextjs-16/mion-app/api/src/handlers/orders.ts") },
        {
          path: "app/orders/page.tsx",
          content: readStarterFile("nextjs-16/mion-app/app/orders/page.tsx", {
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
      content: readStarterFile(SERVER_FILES[options.deployTarget], serverReplacements)
    });
    if (options.deployTarget === "vercel-serverless") {
      const catchAllDir = getCatchAllDir(cwd);
      files.push({
        path: `${catchAllDir}/route.ts`,
        content: readStarterFile("nextjs-16/mion-app/app/api/[...mion]/route.ts", { API_WORKSPACE: apiWorkspaceName })
      });
    }
    rootScripts = getNextjsRootScripts(apiWorkspaceName);
  } else {
    throw new Error(`Framework "${project.framework}" is not yet supported. Only Next.js is currently available.`);
  }
  console.log("\nCreating files:");
  writeFiles(cwd, files);
  console.log("\nUpdating root package.json:");
  const rootDependencies = { "@mionkit/client": "^0.7.2" };
  updateRootPackageJson(cwd, rootScripts, rootDependencies);
  printInstructions(options.deployTarget);
}
function getCatchAllDir(cwd) {
  if (existsSync(join(cwd, "src/app"))) return "src/app/api/[...mion]";
  if (existsSync(join(cwd, "app"))) return "app/api/[...mion]";
  return "src/app/api/[...mion]";
}
function updateRootPackageJson(cwd, scripts, dependencies) {
  const pkgPath = join(cwd, "package.json");
  const pkg = readJson(pkgPath);
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
  writeJson(pkgPath, pkg);
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
export {
  init
};
//# sourceMappingURL=init.js.map
