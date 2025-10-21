import type { Edge as RFEdge, Node as RFNode } from "reactflow";
import { CustomNode } from "./CustomNode";
import dagre from "dagre";

export const NODE_TYPES = { custom: CustomNode }; // This will be populated later with custom nodes
export const initialNodes: RFNode[] = []; // Start with empty nodes for drag and drop

export const initialEdges: RFEdge[] = []; // Start with empty edges

export function toWorkflowDefinition(nodes: RFNode[], edges: RFEdge[]) {
  // 依據 data.type 與 data.config 輸出工作流定義
  const nodeDefs = nodes.map((n) => {
    const type = (n.data as any)?.type ?? inferTypeById(n.id);
    const config = (n.data as any)?.config ?? defaultConfig(type);
    const name = (n.data as any)?.label ?? type.toUpperCase();
    return { id: n.id, name, type, config, position: n.position } as any;
  });

  const edgeDefs = edges.map((e) => ({ from: e.source, to: e.target }));
  const startNodeId = nodes[0]?.id ?? "";

  return {
    id: "wf-from-reactflow",
    name: "WF from React Flow",
    nodes: nodeDefs,
    edges: edgeDefs,
    startNodeId,
  };
}

export function fromWorkflowDefinition(wf: any): { nodes: RFNode[]; edges: RFEdge[] } {
  const nodes: RFNode[] = wf.nodes.map((n: any) => ({
    id: n.id,
    position: n.position || { x: 100, y: 100 }, // 使用載入的位置，如果沒有則使用預設值
    data: { label: n.name, type: n.type, config: n.config, icon: getNodeIcon(n.type) },
    type: "custom",
  }));

  const edges: RFEdge[] = wf.edges.map((e: any) => ({
    id: `edge-${e.from}-${e.to}`,
    source: e.from,
    target: e.to,
  }));

  // Dagre layout
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));
  dagreGraph.setGraph({ rankdir: "TB", ranksep: 100, nodesep: 50 }); // Top-bottom layout, increased spacing

  const nodeWidth = 172; // Default node width, adjust as needed
  const nodeHeight = 70; // Default node height, adjusted to be larger for better spacing

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  nodes.forEach((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    node.position = {
      x: nodeWithPosition.x - nodeWidth / 2,
      y: nodeWithPosition.y - nodeHeight / 2,
    };
  });

  return { nodes, edges };
}

function inferTypeById(id: string): string {
  if (id.startsWith("http")) return "http";
  if (id.startsWith("delay")) return "delay";
  return "code";
}

export function defaultConfig(type: string): any {
  if (type === "http") return { method: "GET", url: "https://jsonplaceholder.typicode.com/todos/1" };
  if (type === "delay") return { ms: 300 };
  if (type === "code") return { code: "return input;" };
  if (type === "mcp") return { client: { command: "node" }, tool: { name: "echo", args: { text: "hello" } } };
  if (type === "database") return { connectionString: "", query: "SELECT * FROM users;" };
  if (type === "gql") return { endpoint: "https://graphqlzero.almansi.me/api", type: "query", gqlString: "query { todos { data { id title completed } } }" };
  return {};
}

export function getNodeIcon(type: string): string {
  switch (type) {
    case "http":
      return "🌐";
    case "delay":
      return "⏱️";
    case "code":
      return "👨‍💻";
    case "mcp":
      return "🤖";
    case "database":
      return "🗃️";
    case "gql":
      return "🔮";
    default:
      return "?";
  }
}


