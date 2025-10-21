import { WorkflowEngine } from "../src/engine/workflowEngine.js";
import { HttpNode } from "../src/nodes/http.js";
import { DelayNode } from "../src/nodes/delay.js";
import { CodeNode } from "../src/nodes/code.js";
import type { WorkflowDefinition } from "../src/engine/types.js";
import { createConsoleLogger } from "../src/utils/logger.js";

async function demo() {
  const logger = createConsoleLogger();
  const wf: WorkflowDefinition = {
    id: "basic-1",
    name: "Basic Demo",
    nodes: [
      new HttpNode({ id: "http", name: "Get Todo", config: { method: "GET", url: "https://jsonplaceholder.typicode.com/todos/1" } }),
      new DelayNode({ id: "wait", name: "Delay", config: { ms: 300 } }),
      new CodeNode({ id: "map", name: "Map", config: { code: `return { id: input.data.id, title: input.data.title };` } }),
    ],
    edges: [
      { from: "http", to: "wait" },
      { from: "wait", to: "map" },
    ],
    startNodeId: "http",
  };
  const engine = new WorkflowEngine({ logger });
  const out = await engine.run(wf, {});
  logger.info("Demo output", { out });
}

demo().catch((e) => {
  // eslint-disable-next-line no-console
  console.error(e);
  process.exit(1);
});


