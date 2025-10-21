import { randomUUID } from "node:crypto";
import type {
  EngineOptions,
  INode,
  JsonValue,
  Logger,
  NodeContext,
  WorkflowDefinition,
  WorkflowRunOptions,
} from "./types.js";

export class WorkflowEngine {
  private readonly logger: Logger;

  constructor(options: EngineOptions) {
    this.logger = options.logger;
  }

  async run(definition: WorkflowDefinition, input: JsonValue, options?: WorkflowRunOptions): Promise<JsonValue> {
    const runId = randomUUID();
    const timeoutMs = options?.timeoutMs ?? 60_000;
    const nodesById = new Map<string, INode>(definition.nodes.map((n) => [n.id, n]));
    const outgoing = buildAdjacency(definition);

    ensureValid(definition, nodesById);

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      let currentNodeId: string | undefined = definition.startNodeId;
      let currentInput: JsonValue = input;
      let lastOutput: JsonValue = null;

      while (currentNodeId) {
        const node = nodesById.get(currentNodeId)!;
        const context: NodeContext = {
          runId,
          nodeId: node.id,
          workflowId: definition.id,
          logger: this.logger,
        };
        this.logger.info(`Executing node ${node.name} (${node.type})`, { nodeId: node.id });
        const result = await node.execute(currentInput, context);
        lastOutput = result.output;

        const nextId = outgoing.get(node.id)?.[0];
        if (!nextId) break;
        currentNodeId = nextId;
        currentInput = lastOutput;
      }

      return lastOutput;
    } finally {
      clearTimeout(timer);
    }
  }
}

function buildAdjacency(def: WorkflowDefinition): Map<string, string[]> {
  const map = new Map<string, string[]>();
  for (const edge of def.edges) {
    const list = map.get(edge.from) ?? [];
    list.push(edge.to);
    map.set(edge.from, list);
  }
  return map;
}

function ensureValid(def: WorkflowDefinition, nodesById: Map<string, INode>) {
  if (!nodesById.has(def.startNodeId)) {
    throw new Error(`Start node ${def.startNodeId} not found`);
  }
  for (const edge of def.edges) {
    if (!nodesById.has(edge.from)) throw new Error(`Edge.from not found: ${edge.from}`);
    if (!nodesById.has(edge.to)) throw new Error(`Edge.to not found: ${edge.to}`);
  }
}


