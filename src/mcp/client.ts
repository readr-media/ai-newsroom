import { spawn, type ChildProcessWithoutNullStreams } from "node:child_process";

export interface MCPClientOptions {
  command: string;
  args?: string[];
  env?: NodeJS.ProcessEnv;
  cwd?: string;
  clientName?: string;
  clientVersion?: string;
}

export interface MCPToolCallParams {
  name: string;
  args?: Record<string, unknown>;
}

export class MCPClient {
  private readonly options: MCPClientOptions;
  private proc: ChildProcessWithoutNullStreams | null = null;
  private client: any | null = null;
  private transport: any | null = null;

  constructor(options: MCPClientOptions) {
    this.options = options;
  }

  async connect(): Promise<void> {
    if (this.client) return;
    const { command, args = [], env, cwd } = this.options;
    this.proc = spawn(command, args, {
      env: { ...process.env, ...env },
      cwd,
      stdio: ["pipe", "pipe", "inherit"],
    });

    const sdkClient = await import("@modelcontextprotocol/sdk/client/index.js").then((m) => m as unknown as any);
    const sdkStdio = await import("@modelcontextprotocol/sdk/client/stdio.js").then((m) => m as unknown as any);

    this.transport = new sdkStdio.StdioClientTransport(this.proc.stdout, this.proc.stdin);
    this.client = new sdkClient.Client(this.transport);

    await this.client.initialize({
      name: this.options.clientName ?? "ai-automation-workflow",
      version: this.options.clientVersion ?? "0.1.0",
    });
  }

  async listTools(): Promise<any> {
    if (!this.client) throw new Error("MCP client not connected");
    // Fallback to generic request API for compatibility across SDK versions
    if (typeof this.client.request === "function") {
      return await this.client.request("tools/list", {});
    }
    if (this.client.tools?.list) return await this.client.tools.list();
    throw new Error("MCP client does not support tools/list");
  }

  async callTool(params: MCPToolCallParams): Promise<any> {
    if (!this.client) throw new Error("MCP client not connected");
    const { name, args } = params;
    if (typeof this.client.request === "function") {
      return await this.client.request("tools/call", { name, arguments: args ?? {} });
    }
    if (this.client.tools?.call) return await this.client.tools.call({ name, arguments: args ?? {} });
    throw new Error("MCP client does not support tools/call");
  }

  async close(): Promise<void> {
    try {
      if (this.client?.close) await this.client.close();
    } finally {
      if (this.transport?.close) this.transport.close();
      if (this.proc) {
        this.proc.kill();
        this.proc = null;
      }
      this.client = null;
      this.transport = null;
    }
  }
}


