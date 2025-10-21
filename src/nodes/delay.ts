import type { INode, JsonValue, NodeConfig, NodeContext, NodeExecutionResult } from "../engine/types.js";

export interface DelayNodeConfig extends NodeConfig {
  ms: number;
}

export class DelayNode implements INode<DelayNodeConfig> {
  readonly id: string;
  readonly name: string;
  readonly type = "delay" as const;
  readonly config: DelayNodeConfig;

  constructor(args: { id: string; name: string; config: DelayNodeConfig }) {
    this.id = args.id;
    this.name = args.name;
    this.config = args.config;
  }

  async execute(input: JsonValue, context: NodeContext): Promise<NodeExecutionResult> {
    await new Promise((resolve) => setTimeout(resolve, this.config.ms));
    context.logger.debug(`Delayed ${this.config.ms}ms`);
    return { output: input };
  }
}


