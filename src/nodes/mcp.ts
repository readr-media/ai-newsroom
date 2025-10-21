import type { INode, JsonValue, NodeConfig, NodeContext, NodeExecutionResult } from "../engine/types.js";
import { MCPClient, type MCPClientOptions } from "../mcp/client.js";

export interface MCPNodeConfig extends NodeConfig {
  client: MCPClientOptions;
  tool: { name: string; args?: Record<string, unknown> } | { list: true };
}

export class MCPNode implements INode<MCPNodeConfig> {
  readonly id: string;
  readonly name: string;
  readonly type = "mcp" as const;
  readonly config: MCPNodeConfig;

  constructor(args: { id: string; name: string; config: MCPNodeConfig }) {
    this.id = args.id;
    this.name = args.name;
    this.config = args.config;
  }

  async execute(input: JsonValue, context: NodeContext): Promise<NodeExecutionResult> {
    const client = new MCPClient(this.config.client);
    await client.connect();
    try {
      if ("list" in this.config.tool) {
        const tools = await client.listTools();
        context.logger.debug("MCP tools listed", tools);
        return { output: tools };
      }
      const args = this.config.tool.args ?? (typeof input === "object" && input ? (input as Record<string, unknown>) : {});
      const res = await client.callTool({ name: this.config.tool.name, args });
      context.logger.debug("MCP tool called", res);
      return { output: res };
    } finally {
      await client.close();
    }
  }
}


