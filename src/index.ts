import { WorkflowEngine } from "./engine/workflowEngine.js";
import { HttpNode } from "./nodes/http.js";
import { DelayNode } from "./nodes/delay.js";
import { CodeNode } from "./nodes/code.js";
import type { WorkflowDefinition } from "./engine/types.js";
import { createConsoleLogger } from "./utils/logger.js";

async function main() {
  const logger = createConsoleLogger();

  const workflow: WorkflowDefinition = {
    id: "hello-workflow",
    name: "Hello World Workflow",
    nodes: [
      new HttpNode({
        id: "http-1",
        name: "Fetch JSONPlaceholder",
        config: {
          method: "GET",
          url: "https://jsonplaceholder.typicode.com/todos/1"
        }
      }),
      new DelayNode({ id: "delay-1", name: "Wait 500ms", config: { ms: 500 } }),
      new CodeNode({
        id: "code-1",
        name: "Transform",
        config: {
          code: `return { title: input.title, id: input.id, note: "done" };`
        }
      })
    ],
    edges: [
      { from: "http-1", to: "delay-1" },
      { from: "delay-1", to: "code-1" }
    ],
    startNodeId: "http-1"
  };

  const engine = new WorkflowEngine({ logger });
  const result = await engine.run(workflow, {});
  logger.info("Workflow result", { result });
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});


