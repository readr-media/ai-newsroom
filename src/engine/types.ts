export type JsonValue = string | number | boolean | null | JsonObject | JsonArray;
export type JsonObject = { [key: string]: JsonValue };
export type JsonArray = JsonValue[];

export interface Logger {
  debug(message: string, meta?: unknown): void;
  info(message: string, meta?: unknown): void;
  warn(message: string, meta?: unknown): void;
  error(message: string, meta?: unknown): void;
}

export interface NodeContext {
  runId: string;
  nodeId: string;
  workflowId: string;
  logger: Logger;
}

export interface NodeConfig {
  [key: string]: unknown;
}

export interface NodeExecutionResult {
  output: JsonValue;
}

export interface INode<C extends NodeConfig = NodeConfig> {
  readonly id: string;
  readonly name: string;
  readonly type: string;
  readonly config: C;
  execute(input: JsonValue, context: NodeContext): Promise<NodeExecutionResult>;
}

export interface EdgeDefinition {
  from: string;
  to: string;
}

export interface WorkflowDefinition {
  id: string;
  name: string;
  nodes: INode[];
  edges: EdgeDefinition[];
  startNodeId: string;
}

export interface WorkflowRunOptions {
  timeoutMs?: number;
}

export interface EngineOptions {
  logger: Logger;
}


