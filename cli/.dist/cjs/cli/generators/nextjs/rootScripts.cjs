"use strict";
Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
function getNextjsRootScripts(apiWorkspaceName) {
  return {
    dev: `concurrently "npm run dev -w ${apiWorkspaceName}" "next dev"`,
    build: `npm run build -w ${apiWorkspaceName} && next build`
  };
}
exports.getNextjsRootScripts = getNextjsRootScripts;
//# sourceMappingURL=rootScripts.cjs.map
