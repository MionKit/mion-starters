"use strict";
Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
function generateApiPackageJson(opts) {
  const deps = {
    "@mionjs/core": "^0.7.2",
    "@mionjs/router": "^0.7.2"
  };
  const devDeps = {
    "@mionjs/devtools": "^0.8.0",
    vite: "^7.3.1",
    "vite-node": "^5.3.0"
  };
  if (opts.deployTarget === "vercel-serverless") {
    deps["@mionjs/platform-vercel"] = "^0.7.2";
    devDeps["@mionjs/platform-node"] = "^0.7.2";
  } else if (opts.deployTarget === "standalone-bun") {
    deps["@mionjs/platform-bun"] = "^0.7.2";
  } else {
    deps["@mionjs/platform-node"] = "^0.7.2";
  }
  const pkg = {
    name: `@${opts.projectName}/api`,
    version: "0.1.0",
    private: true,
    type: "module",
    main: "./dist/server.js",
    exports: { ".": "./src/routes.ts", "./dist/*": "./dist/*" },
    scripts: {
      dev: "vite-node src/server.ts",
      build: "vite build"
    },
    dependencies: deps,
    devDependencies: devDeps
  };
  return JSON.stringify(pkg, null, 2) + "\n";
}
exports.generateApiPackageJson = generateApiPackageJson;
//# sourceMappingURL=apiPackageJson.cjs.map
