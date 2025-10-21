import type { INode, JsonValue, NodeContext, NodeExecutionResult } from "../engine/types.js";

interface DatabaseConfig {
  connectionString: string;
  query: string;
}

export class DatabaseNode implements INode<DatabaseConfig> {
  readonly id: string;
  readonly name: string;
  readonly type: "database" = "database";
  readonly config: DatabaseConfig;

  constructor({ id, name, config }: { id: string; name: string; config: DatabaseConfig }) {
    this.id = id;
    this.name = name;
    this.config = config;
  }

  async execute(input: JsonValue, context: NodeContext): Promise<NodeExecutionResult> {
    context.logger.info(`Executing Database Node: ${this.name} with query: ${this.config.query}`, { input });

    // Simulate database query
    const result = { 
      query: this.config.query, 
      data: [{ id: 1, value: "test_data_1" }, { id: 2, value: "test_data_2" }], 
      input 
    };

    return { output: result };
  }
}
