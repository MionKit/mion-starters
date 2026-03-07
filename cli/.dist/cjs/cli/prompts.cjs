"use strict";
Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
const node_readline = require("node:readline");
const DEPLOY_OPTIONS = [
  { label: "Vercel Serverless (default)", value: "vercel-serverless" },
  { label: "Standalone Node.js", value: "standalone-node" },
  { label: "Standalone Bun", value: "standalone-bun" }
];
async function promptInitOptions() {
  const rl = node_readline.createInterface({ input: process.stdin, output: process.stdout });
  const ask = (question) => new Promise((resolve) => rl.question(question, (answer) => resolve(answer.trim())));
  try {
    console.log("\n? Deployment target:");
    DEPLOY_OPTIONS.forEach((opt, i) => {
      console.log(`  ${i + 1}) ${opt.label}`);
    });
    const targetAnswer = await ask("  Enter choice [1]: ");
    const targetIndex = targetAnswer ? parseInt(targetAnswer, 10) - 1 : 0;
    const deployTarget = DEPLOY_OPTIONS[targetIndex]?.value || DEPLOY_OPTIONS[0].value;
    console.log(`  > ${DEPLOY_OPTIONS[targetIndex]?.label || DEPLOY_OPTIONS[0].label}
`);
    const basePathAnswer = await ask("? API base path [/api/mion]: ");
    const basePath = basePathAnswer || "/api/mion";
    console.log(`  > ${basePath}
`);
    const exampleAnswer = await ask("? Include example API (orders showcase)? [y/N]: ");
    const withExample = exampleAnswer.toLowerCase() === "y" || exampleAnswer.toLowerCase() === "yes";
    console.log(`  > ${withExample ? "Yes" : "No"}
`);
    return { deployTarget, basePath, withExample };
  } finally {
    rl.close();
  }
}
exports.promptInitOptions = promptInitOptions;
//# sourceMappingURL=prompts.cjs.map
