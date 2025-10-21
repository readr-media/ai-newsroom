import axios, { AxiosRequestConfig } from "axios";
import type { INode, JsonValue, NodeConfig, NodeContext, NodeExecutionResult } from "../engine/types.js";

export interface HttpNodeConfig extends NodeConfig {
  method: AxiosRequestConfig["method"];
  url: string;
  headers?: Record<string, string>;
  params?: Record<string, string | number | boolean>;
  body?: unknown;
  timeoutMs?: number;
}

export class HttpNode implements INode<HttpNodeConfig> {
  readonly id: string;
  readonly name: string;
  readonly type = "http" as const;
  readonly config: HttpNodeConfig;

  constructor(args: { id: string; name: string; config: HttpNodeConfig }) {
    this.id = args.id;
    this.name = args.name;
    this.config = args.config;
  }

  async execute(input: JsonValue, context: NodeContext): Promise<NodeExecutionResult> {
    const { method, url, headers, params, body, timeoutMs } = this.config;
    const response = await axios.request({
      method,
      url,
      headers,
      params,
      data: body ?? input,
      timeout: timeoutMs ?? 30_000,
      validateStatus: () => true,
    });
    context.logger.debug(`HTTP ${method} ${url} -> ${response.status}`);
    return { output: { status: response.status, data: response.data } };
  }
}


