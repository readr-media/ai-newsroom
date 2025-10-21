import { z } from "zod";
import type { WorkflowDefinition } from "./types.js";
import { HttpNode } from "../nodes/http.js";
import { DelayNode } from "../nodes/delay.js";
import { CodeNode } from "../nodes/code.js";
import { MCPNode } from "../nodes/mcp.js";
import { DatabaseNode } from "../nodes/database.js";
import { GQLNode } from "../nodes/gql.js";

const HttpConfigSchema = z.object({
  method: z.string(),
  url: z.string(),
  headers: z.record(z.string()).optional(),
  params: z.record(z.union([z.string(), z.number(), z.boolean()])).optional(),
  body: z.unknown().optional(),
  timeoutMs: z.number().int().positive().optional(),
});

const DelayConfigSchema = z.object({ ms: z.number().int().nonnegative() });

const CodeConfigSchema = z.object({ code: z.string() });

const MCPClientSchema = z.object({
  command: z.string(),
  args: z.array(z.string()).optional(),
  env: z.record(z.string()).optional(),
  cwd: z.string().optional(),
  clientName: z.string().optional(),
  clientVersion: z.string().optional(),
});

const MCPToolSchema = z.union([
  z.object({ list: z.literal(true) }),
  z.object({ name: z.string(), args: z.record(z.unknown()).optional() }),
]);

const MCPConfigSchema = z.object({ client: MCPClientSchema, tool: MCPToolSchema });

const DatabaseConfigSchema = z.object({
  connectionString: z.string(),
  query: z.string(),
});

const GqlConfigSchema = z.object({
  endpoint: z.string().url(),
  type: z.union([z.literal("query"), z.literal("mutation")]),
  gqlString: z.string(),
});

const BaseNodeSchema = z.object({ id: z.string(), name: z.string(), type: z.string() });

const NodeSchema = z.discriminatedUnion("type", [
  BaseNodeSchema.extend({ type: z.literal("http"), config: HttpConfigSchema }),
  BaseNodeSchema.extend({ type: z.literal("delay"), config: DelayConfigSchema }),
  BaseNodeSchema.extend({ type: z.literal("code"), config: CodeConfigSchema }),
  BaseNodeSchema.extend({ type: z.literal("mcp"), config: MCPConfigSchema }),
  BaseNodeSchema.extend({ type: z.literal("database"), config: DatabaseConfigSchema }),
  BaseNodeSchema.extend({ type: z.literal("gql"), config: GqlConfigSchema }),
]);

const EdgeSchema = z.object({ from: z.string(), to: z.string() });

const WorkflowJsonSchema = z.object({
  id: z.string(),
  name: z.string(),
  nodes: z.array(NodeSchema),
  edges: z.array(EdgeSchema),
  startNodeId: z.string(),
});

export type WorkflowJson = z.infer<typeof WorkflowJsonSchema>;

export function parseWorkflowJson(input: unknown): WorkflowDefinition {
  const wf = WorkflowJsonSchema.parse(input);
  const nodes = wf.nodes.map((n) => {
    switch (n.type) {
      case "http":
        return new HttpNode({ id: n.id, name: n.name, config: n.config });
      case "delay":
        return new DelayNode({ id: n.id, name: n.name, config: n.config });
      case "code":
        return new CodeNode({ id: n.id, name: n.name, config: n.config });
      case "mcp":
        return new MCPNode({ id: n.id, name: n.name, config: n.config });
      case "database":
        return new DatabaseNode({ id: n.id, name: n.name, config: n.config });
      case "gql":
        return new GQLNode({ id: n.id, name: n.name, config: n.config });
      default:
        throw new Error(`Unknown node type: ${(n as any).type}`);
    }
  });

  return { id: wf.id, name: wf.name, nodes, edges: wf.edges, startNodeId: wf.startNodeId };
}