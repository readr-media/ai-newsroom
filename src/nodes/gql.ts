import type { INode, JsonValue, NodeContext, NodeExecutionResult } from "../engine/types.js";

interface GqlConfig {
  endpoint: string;
  type: "query" | "mutation";
  gqlString: string;
}

export class GQLNode implements INode<GqlConfig> {
  readonly id: string;
  readonly name: string;
  readonly type: "gql" = "gql";
  readonly config: GqlConfig;

  constructor({ id, name, config }: { id: string; name: string; config: GqlConfig }) {
    this.id = id;
    this.name = name;
    this.config = config;
  }

  async execute(input: JsonValue, context: NodeContext): Promise<NodeExecutionResult> {
    context.logger.info(`Executing GQL Node: ${this.name} (${this.config.type}) to ${this.config.endpoint}`, { input });

    // Simulate GQL request
    const result = {
      endpoint: this.config.endpoint,
      type: this.config.type,
      gqlString: this.config.gqlString,
      response: { data: { message: `Simulated GQL ${this.config.type} response` } },
      input,
    };

    return { output: result };
  }
}
