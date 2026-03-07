#!/usr/bin/env node
import { init } from "./init.js";
const args = process.argv.slice(2);
const command = args[0];
if (command === "init") {
  init(process.cwd()).catch((err) => {
    console.error("\nError:", err.message);
    process.exit(1);
  });
} else {
  console.log(`
@mionjs/starter — Scaffold mion into your meta-framework project

Usage:
  npx @mionjs/starter init    Scaffold mion API into the current project

Options:
  --help                       Show this help message
`);
  if (command && command !== "--help") {
    console.error(`Unknown command: ${command}`);
    process.exit(1);
  }
}
//# sourceMappingURL=index.js.map
