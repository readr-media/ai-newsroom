import type { INode, JsonValue, NodeConfig, NodeContext, NodeExecutionResult } from "../engine/types.js";

export interface CodeNodeConfig extends NodeConfig {
  code: string; // expects a JS snippet: (input, context) => any OR bare body returning value
}

export class CodeNode implements INode<CodeNodeConfig> {
  readonly id: string;
  readonly name: string;
  readonly type = "code" as const;
  readonly config: CodeNodeConfig;

  constructor(args: { id: string; name: string; config: CodeNodeConfig }) {
    this.id = args.id;
    this.name = args.name;
    this.config = args.config;
  }

  async execute(input: JsonValue, context: NodeContext): Promise<NodeExecutionResult> {
    const fn = compileUserCode(this.config.code);
    const output = await Promise.resolve(fn(input, context));
    return { output };
  }
}

function compileUserCode(source: string): (input: JsonValue, context: NodeContext) => unknown {
  // Provide a safe-ish Function wrapper. In real production, sandboxing (vm2) is recommended.
  // eslint-disable-next-line no-new-func
  const maybeArrow = source.trim().startsWith("(") || source.trim().startsWith("input")
    ? source
    : `(function user(input, context) { ${source} })`;
  // eslint-disable-next-line no-new-func
  const fn = new Function("input", "context", `return (${maybeArrow});`);
  const compiled = fn();
  if (typeof compiled === "function") return compiled as (i: JsonValue, c: NodeContext) => unknown;
  return () => compiled;
}


