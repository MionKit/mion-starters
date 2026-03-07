function getNextjsRootScripts(apiWorkspaceName) {
  return {
    dev: `concurrently "npm run dev -w ${apiWorkspaceName}" "next dev"`,
    build: `npm run build -w ${apiWorkspaceName} && next build`
  };
}
export {
  getNextjsRootScripts
};
//# sourceMappingURL=rootScripts.js.map
