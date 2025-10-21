import { WorkflowEngine } from "../src/engine/workflowEngine.js";
import type { WorkflowDefinition } from "../src/engine/types.js";
import { MCPNode } from "../src/nodes/mcp.js";
import { createConsoleLogger } from "../src/utils/logger.js";

// Example assumes you have an MCP server available as a local executable.
// Replace command and args below with your own MCP server.

async function demo() {
  const logger = createConsoleLogger();

  const wf: WorkflowDefinition = {
    id: "mcp-demo-1",
    name: "MCP Demo",
    nodes: [
      new MCPNode({
        id: "tools",
        name: "List Tools",
        config: {
          client: { command: process.env.MCP_CMD ?? "node", args: process.env.MCP_ARGS ? JSON.parse(process.env.MCP_ARGS) : ["./your-mcp-server.js"] },
          tool: { list: true },
        },
      }),
      new MCPNode({
        id: "call",
        name: "Call Tool",
        config: {
          client: { command: process.env.MCP_CMD ?? "node", args: process.env.MCP_ARGS ? JSON.parse(process.env.MCP_ARGS) : ["./your-mcp-server.js"] },
          tool: { name: process.env.MCP_TOOL ?? "echo", args: { text: "hello from workflow" } },
        },
      }),
    ],
    edges: [
      { from: "tools", to: "call" },
    ],
    startNodeId: "tools",
  };

  const engine = new WorkflowEngine({ logger });
  const out = await engine.run(wf, {});
  logger.info("MCP demo output", { out });
}

demo().catch((e) => {
  // eslint-disable-next-line no-console
  console.error(e);
  process.exit(1);
});


