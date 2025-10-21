# AI Automation Workflow (MCP-enabled, n8n-like minimal)

一個極簡、可程式化的自動化工作流引擎，支援 MCP client 節點，靈感來源於 n8n 的可視化/節點化理念（不含前端 UI，聚焦於可嵌入的程式 API）。

參考專案：n8n（Workflow Automation）
- 連結：[https://github.com/n8n-io/n8n](https://github.com/n8n-io/n8n)

## 功能
- 工作流引擎（直線串接，單一出口）：`WorkflowEngine`
- 節點系統：`HTTP`、`Delay`、`Code`、`MCP`
- MCP Client：透過 `@modelcontextprotocol/sdk` 串接任意 MCP 伺服器工具
- 範例：`examples/workflow-basic.ts`、`examples/workflow-mcp.ts`

## 安裝

```bash
npm i
```

（或使用 pnpm/yarn 皆可）

## 快速開始

開發模式（示範 `src/index.ts` 的基本工作流）：

```bash
npm run dev
```

啟動後端 API 與前端可視化編輯器（兩個服務同時啟動）：

```bash
npm run dev:all
```

**使用可視化編輯器 (http://localhost:5173)**

- 從左側「工具箱」拖曳節點到畫布上新增節點。
- 點擊畫布上的節點，右側「屬性」面板會顯示其配置，可進行編輯或刪除節點。
- 拖曳節點之間的連接點來建立工作流邊緣。
- 點擊右上角「執行」按鈕，即可將目前畫布上的工作流發送至後端 API 執行，結果顯示在右側「輸出」面板。

單獨啟動：

```bash
npm run server:dev   # 啟動 Express /run API（預設 http://localhost:8787）
npm run web:dev      # 啟動 Vite 前端（預設 http://localhost:5173）
```

執行基本範例：

```bash
npm run example:basic
```

編譯與執行 build 產物：

```bash
npm run build
npm start
```

## MCP 範例

`examples/workflow-mcp.ts` 需要一個已存在、可從 CLI 啟動的 MCP Server。請以環境變數指定：

- `MCP_CMD`：MCP 伺服器啟動命令（可為絕對路徑或在 PATH 中的指令）
- `MCP_ARGS`：JSON 陣列字串，對應命令參數
- （可選）`MCP_TOOL`：欲呼叫的工具名稱，預設為 `echo`

執行範例（以你的 MCP server 為例）：

```bash
MCP_CMD="/path/to/your/mcp-server" MCP_ARGS='["--flag","value"]' npm run example:mcp
```

> 提示：`examples/workflow-mcp.ts` 內預設會嘗試先列出 tools（`tools/list`），然後呼叫 `MCP_TOOL` 指定的工具；若未設置，預設工具為 `echo`。

## 程式用法（最低可行）

建立一個工作流（TypeScript）：

```ts
import { WorkflowEngine } from "./src/engine/workflowEngine";
import { HttpNode } from "./src/nodes/http";
import { DelayNode } from "./src/nodes/delay";
import { CodeNode } from "./src/nodes/code";
import type { WorkflowDefinition } from "./src/engine/types";

const wf: WorkflowDefinition = {
  id: "basic",
  name: "Basic",
  nodes: [
    new HttpNode({ id: "http", name: "Get", config: { method: "GET", url: "https://example.com" } }),
    new DelayNode({ id: "wait", name: "Wait", config: { ms: 300 } }),
    new CodeNode({ id: "map", name: "Map", config: { code: "return input;" } }),
  ],
  edges: [ { from: "http", to: "wait" }, { from: "wait", to: "map" } ],
  startNodeId: "http",
};

const engine = new WorkflowEngine({ logger: console });
engine.run(wf, {}).then((out) => console.log(out));
```

## 節點清單

- HTTP 節點（`src/nodes/http.ts`）
  - `method`, `url`, `headers`, `params`, `body`, `timeoutMs`
  - 以 `axios` 執行請求，回傳 `{ status, data }`
- Delay 節點（`src/nodes/delay.ts`）
  - `ms`：延遲毫秒數
- Code 節點（`src/nodes/code.ts`）
  - `code: string`：可傳入表達式或函式，接收 `(input, context)`，回傳任意值
  - 注意：為簡化示範，使用 `Function` 動態編譯，實務建議使用 sandbox（如 vm2）
- MCP 節點（`src/nodes/mcp.ts`）
  - `client: { command, args?, env?, cwd?, clientName?, clientVersion? }`
  - `tool: { list: true }` 或 `{ name: string, args?: Record<string, unknown> }`
  - 若 `tool.args` 未提供，預設使用上一節點輸出（若為物件）作為工具參數

## 擴充自訂節點

實作 `INode` 介面（`src/engine/types.ts`）：

```ts
export interface INode<C extends NodeConfig = NodeConfig> {
  readonly id: string;
  readonly name: string;
  readonly type: string;
  readonly config: C;
  execute(input: JsonValue, context: NodeContext): Promise<NodeExecutionResult>;
}
```

## 設計限制（與未來方向）

- 目前僅支援單一路徑串接（A -> B -> C）；未支援分支/條件/多輸出/錯誤路徑
- 無工作流儲存層與 UI（聚焦為可被嵌入的程式庫）
- MCP 僅示範 tools/list 與 tools/call，未涵蓋資料集、資源等擴展
- 後續可考慮：有向無環圖（DAG）執行、併發、節點重試/補償、視覺化 UI

## 授權

MIT

## 使用 JSON 描述工作流

你可以以 JSON 檔案描述工作流，並用 parser 轉為執行定義。

範例檔：`examples/workflow-basic.json`

執行 JSON 工作流：

```bash
npm run example:json -- examples/workflow-basic.json
```

後端 `/run` API 也支援 JSON：

```bash
curl -X POST http://localhost:8787/run \
  -H 'content-type: application/json' \
  -d @examples/workflow-basic.json
```

或是包在 body 的 `workflow` 欄位中：

```bash
curl -X POST http://localhost:8787/run \
  -H 'content-type: application/json' \
  -d '{"workflow": {"id":"...","name":"...","nodes":[...],"edges":[...],"startNodeId":"..."}}'
```
