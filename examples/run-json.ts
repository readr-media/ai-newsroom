import { readFileSync } from "node:fs";
import { WorkflowEngine } from "../src/engine/workflowEngine.js";
import { parseWorkflowJson } from "../src/engine/parser.js";
import { createConsoleLogger } from "../src/utils/logger.js";

async function main() {
  const file = process.argv[2] ?? "examples/workflow-basic.json";
  const json = JSON.parse(readFileSync(file, "utf8"));
  const def = parseWorkflowJson(json);
  const engine = new WorkflowEngine({ logger: createConsoleLogger() });
  const out = await engine.run(def, {});
  // eslint-disable-next-line no-console
  console.log(JSON.stringify(out, null, 2));
}

main().catch((e) => {
  // eslint-disable-next-line no-console
  console.error(e);
  process.exit(1);
});


