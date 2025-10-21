import React, { useCallback, useMemo, useState, useRef } from "react";
import ReactFlow, { addEdge, Background, Controls, MiniMap, useEdgesState, useNodesState, Panel, useReactFlow, type Connection, type Edge, type Node } from "reactflow";
import "reactflow/dist/style.css";

import { initialEdges, toWorkflowDefinition, defaultConfig, NODE_TYPES, getNodeIcon, fromWorkflowDefinition } from "./model";

export function App() {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const { screenToFlowPosition, fitView } = useReactFlow();
  const [nodes, setNodes, onNodesChange] = useNodesState([]); // Start with empty nodes
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [serverUrl, setServerUrl] = useState<string>("http://localhost:8787");
  const [runResult, setRunResult] = useState<any>(null);
  const [workflowName, setWorkflowName] = useState<string>("my-workflow");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [availableWorkflows, setAvailableWorkflows] = useState<string[]>([]);

  const fetchWorkflows = useCallback(async () => {
    try {
      const res = await fetch(`${serverUrl}/list-workflows`);
      const json = await res.json();
      if (json.ok) {
        setAvailableWorkflows(json.workflows);
      } else {
        console.error("Error listing workflows:", json.error);
        setAvailableWorkflows([]);
      }
    } catch (e) {
      console.error("Failed to fetch workflow list:", e);
      setAvailableWorkflows([]);
    }
  }, [serverUrl]);

  // Effect to load available workflows on mount or server URL change
  React.useEffect(() => {
    fetchWorkflows();
  }, [serverUrl, fetchWorkflows]); // Added fetchWorkflows to dependency array

  const clearWorkflow = useCallback(() => {
    setNodes([]);
    setEdges([]);
    setWorkflowName("");
    setRunResult(null);
    setSelectedId(null);
  }, [setNodes, setEdges, setWorkflowName, setRunResult, setSelectedId]);

  const onConnect = useCallback((connection: Connection) => setEdges((eds) => addEdge(connection, eds)), [setEdges]);

  // Refactored addNode for drag-and-drop
  const addNode = useCallback((type: "http" | "delay" | "code" | "mcp" | "database", position) => {
    const idBase = `${type}-${Math.floor(Math.random() * 10000)}`;
    const newNode = {
      id: idBase, 
      position, 
      data: { label: type.toUpperCase(), type, config: defaultConfig(type), icon: getNodeIcon(type) }, 
      type: "custom" 
    };
    setNodes((nds) => nds.concat(newNode));
  }, [setNodes]);

  const deleteSelected = useCallback(() => {
    if (!selectedId) return;
    setEdges((eds) => eds.filter((e) => e.source !== selectedId && e.target !== selectedId));
    setNodes((nds) => nds.filter((n) => n.id !== selectedId));
    setSelectedId(null);
  }, [selectedId, setNodes, setEdges]);

  const runWorkflow = useCallback(async () => {
    const wf = toWorkflowDefinition(nodes, edges);
    const res = await fetch(`${serverUrl}/run`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ workflow: wf, input: {} }) });
    const json = await res.json();
    setRunResult(json);
  }, [nodes, edges, serverUrl]);

  const saveWorkflow = useCallback(async () => {
    if (!workflowName) {
      alert("Please enter a workflow name.");
      return;
    }
    const wf = toWorkflowDefinition(nodes, edges);
    const res = await fetch(`${serverUrl}/save-workflow`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ workflow: wf, name: workflowName }) });
    const json = await res.json();
    if (json.ok) {
      alert(`Workflow '${workflowName}' saved successfully!`);
      fetchWorkflows(); // Reload workflows after saving
    } else {
      alert(`Error saving workflow: ${json.error}`);
    }
  }, [nodes, edges, serverUrl, workflowName, fetchWorkflows]);

  const loadWorkflow = useCallback(async () => {
    try {
      if (!workflowName) {
        alert("請選擇要載入的工作流程。");
        return;
      }

      const res = await fetch(`${serverUrl}/load-workflow?name=${workflowName}`);
      const json = await res.json();

      if (json.ok) {
        const { nodes: loadedNodes, edges: loadedEdges } = fromWorkflowDefinition(json.workflow);
        setNodes(loadedNodes);
        setEdges(loadedEdges);
        alert(`Workflow '${workflowName}' loaded successfully!`);
        fitView(); // Fit view to new nodes
      } else {
        alert(`Error loading workflow: ${json.error}`);
      }
    } catch (e: any) {
      alert(`載入工作流程時發生錯誤: ${e?.message ?? String(e)}`);
    }
  }, [serverUrl, setNodes, setEdges, workflowName, fitView]);

  const deleteWorkflow = useCallback(async () => {
    if (!workflowName) {
      alert("請選擇要刪除的工作流程。");
      return;
    }
    if (!window.confirm(`確定要刪除工作流程 '${workflowName}' 嗎？這將無法復原。`)) {
      return;
    }
    try {
      const res = await fetch(`${serverUrl}/delete-workflow?name=${workflowName}`, { method: "DELETE" });
      const json = await res.json();
      if (json.ok) {
        alert(`Workflow '${workflowName}' deleted successfully!`);
        fetchWorkflows(); // Reload workflows after deleting
        clearWorkflow(); // Clear current workflow after deleting
      } else {
        alert(`Error deleting workflow: ${json.error}`);
      }
    } catch (e: any) {
      alert(`刪除工作流程時發生錯誤: ${e?.message ?? String(e)}`);
    }
  }, [serverUrl, workflowName, fetchWorkflows, clearWorkflow]);

  const selectedNode: Node | undefined = useMemo(() => nodes.find((n) => n.id === selectedId), [nodes, selectedId]);

  const updateSelectedData = useCallback((updater: (data: any) => any) => {
    if (!selectedId) return;
    setNodes((nds) => nds.map((n) => (n.id === selectedId ? { ...n, data: updater(n.data) } : n)));
  }, [selectedId, setNodes]);

  const onNodeClick = useCallback((_: any, node: Node) => setSelectedId(node.id), []);

  const onPaneClick = useCallback(() => setSelectedId(null), []); // Clear selection when clicking on pane

  const nodeTypes = useMemo(() => NODE_TYPES, []);

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  const onDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault();

    if (reactFlowWrapper.current) {
      const type = event.dataTransfer.getData("application/reactflow") as "http" | "delay" | "code" | "mcp";
      const position = screenToFlowPosition({ x: event.clientX, y: event.clientY });
      addNode(type, position);
    }
  }, [screenToFlowPosition, addNode]);

  const onDragStart = useCallback((event: React.DragEvent, nodeType: string) => {
    event.dataTransfer.setData("application/reactflow", nodeType);
    event.dataTransfer.effectAllowed = "move";
  }, []);

  const ui = useMemo(() => (
    <div className="workflow-editor-layout">
      <header className="workflow-header">
        <div className="header-left">
          <span className="logo">AI Newsroom Agent</span>
          <span className="workflow-name">AI Agent Chat</span>
        </div>
        <div className="header-center">
          <button>Editor</button>
          <button>Executions</button>
        </div>
        <div className="header-right">
          <label>Server URL</label>
          <input className="server-url-input" value={serverUrl} onChange={(e) => setServerUrl(e.target.value)} />
          <button onClick={runWorkflow}>執行</button>
          
          <select
            value={workflowName}
            onChange={(e) => setWorkflowName(e.target.value)}
            style={{ width: "120px", marginRight: "8px" }}
          >
            <option value="">選擇工作流...</option>
            {availableWorkflows.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
          <button onClick={loadWorkflow} disabled={!workflowName}>載入</button>

          <button onClick={clearWorkflow}>新增工作流</button>
          <button onClick={deleteWorkflow} disabled={!workflowName} style={{ color: "#b00" }}>刪除工作流</button>
          <input className="workflow-name-input" value={workflowName} onChange={(e) => setWorkflowName(e.target.value)} placeholder="Workflow Name" />
          <button onClick={saveWorkflow} disabled={!workflowName}>儲存</button>
        </div>
      </header>

      <div className="workflow-content">
        <aside className="workflow-sidebar-left">
          <h3>工具箱</h3>
          <div className="toolbox-nodes">
            <div className="dnd-node" onDragStart={(event) => onDragStart(event, "http")} draggable>
              🌐 HTTP
            </div>
            <div className="dnd-node" onDragStart={(event) => onDragStart(event, "delay")} draggable>
              ⏱️ Delay
            </div>
            <div className="dnd-node" onDragStart={(event) => onDragStart(event, "code")} draggable>
              👨‍💻 Code
            </div>
            <div className="dnd-node" onDragStart={(event) => onDragStart(event, "mcp")} draggable>
              🤖 MCP
            </div>
            <div className="dnd-node" onDragStart={(event) => onDragStart(event, "database")} draggable>
              🗃️ Database
            </div>
          </div>
        </aside>

        <main className="workflow-canvas" ref={reactFlowWrapper}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={onNodeClick}
            onPaneClick={onPaneClick}
            onDrop={onDrop}
            onDragOver={onDragOver}
            fitView
            nodeTypes={nodeTypes}
          >
            <Panel position="top-left">
              <MiniMap />
            </Panel>
            <Controls />
            <Background />
          </ReactFlow>
        </main>

        <aside className="workflow-sidebar-right">
          <h3>屬性</h3>
          {selectedNode ? (
            <div>
              <NodeInspector node={selectedNode} updateData={updateSelectedData} />
              <button style={{ marginTop: 12, color: "#b00" }} onClick={deleteSelected}>刪除節點</button>
            </div>
          ) : (
            <p>選取一個節點以編輯屬性</p>
          )}
          <h3 style={{ marginTop: 16 }}>輸出</h3>
          <pre style={{ whiteSpace: "pre-wrap" }}>{JSON.stringify(runResult, null, 2)}</pre>
        </aside>
      </div>
    </div>
  ), [nodes, edges, onNodesChange, onEdgesChange, onConnect, onNodeClick, runWorkflow, saveWorkflow, loadWorkflow, serverUrl, runResult, selectedNode, updateSelectedData, deleteSelected, onPaneClick, addNode, nodeTypes, onDragStart, onDrop, onDragOver, workflowName, clearWorkflow, availableWorkflows, deleteWorkflow]);

  return ui;
}

function NodeInspector({ node, updateData }: { node: Node, updateData: (updater: (data: any) => any) => void }) {
  const type = (node.data as any)?.type ?? "code";
  const data = (node.data as any) ?? {};
  if (type === "http") {
    return (
      <div>
        <div>
          <label>Label</label>
          <input style={{ width: "100%" }} value={data.label ?? "HTTP"} onChange={(e) => updateData((d: any) => ({ ...d, label: e.target.value }))} />
        </div>
        <div>
          <label>Method</label>
          <select style={{ width: "100%" }} value={data.config?.method ?? "GET"} onChange={(e) => updateData((d: any) => ({ ...d, config: { ...(d.config || {}), method: e.target.value } }))}>
            <option>GET</option>
            <option>POST</option>
            <option>PUT</option>
            <option>PATCH</option>
            <option>DELETE</option>
          </select>
        </div>
        <div>
          <label>URL</label>
          <input style={{ width: "100%" }} value={data.config?.url ?? ""} onChange={(e) => updateData((d: any) => ({ ...d, config: { ...(d.config || {}), url: e.target.value } }))} />
        </div>
      </div>
    );
  }
  if (type === "delay") {
    return (
      <div>
        <div>
          <label>Label</label>
          <input style={{ width: "100%" }} value={data.label ?? "Delay"} onChange={(e) => updateData((d: any) => ({ ...d, label: e.target.value }))} />
        </div>
        <div>
          <label>Milliseconds</label>
          <input type="number" style={{ width: "100%" }} value={data.config?.ms ?? 300} onChange={(e) => updateData((d: any) => ({ ...d, config: { ...(d.config || {}), ms: Number(e.target.value) } }))} />
        </div>
      </div>
    );
  }
  if (type === "mcp") {
    return (
      <div>
        <div>
          <label>Label</label>
          <input style={{ width: "100%" }} value={data.label ?? "MCP"} onChange={(e) => updateData((d: any) => ({ ...d, label: e.target.value }))} />
        </div>
        <div>
          <label>MCP Command</label>
          <input style={{ width: "100%" }} value={data.config?.client?.command ?? ""} onChange={(e) => updateData((d: any) => ({
            ...d,
            config: {
              ...(d.config || {}),
              client: { ...(d.config?.client || {}), command: e.target.value },
            },
          }))} />
        </div>
        <div>
          <label>MCP Tool Name</label>
          <input style={{ width: "100%" }} value={data.config?.tool?.name ?? ""} onChange={(e) => updateData((d: any) => ({
            ...d,
            config: {
              ...(d.config || {}),
              tool: { ...(d.config?.tool || {}), name: e.target.value },
            },
          }))} />
        </div>
        <div>
          <label>MCP Tool Args (JSON)</label>
          <textarea rows={4} style={{ width: "100%" }} value={JSON.stringify(data.config?.tool?.args ?? {}, null, 2)} onChange={(e) => updateData((d: any) => ({
            ...d,
            config: {
              ...(d.config || {}),
              tool: { ...(d.config?.tool || {}), args: JSON.parse(e.target.value) },
            },
          }))} />
        </div>
      </div>
    );
  }
  if (type === "database") {
    return (
      <div>
        <div>
          <label>Label</label>
          <input style={{ width: "100%" }} value={data.label ?? "Database"} onChange={(e) => updateData((d: any) => ({ ...d, label: e.target.value }))} />
        </div>
        <div>
          <label>Connection String</label>
          <input style={{ width: "100%" }} value={data.config?.connectionString ?? ""} onChange={(e) => updateData((d: any) => ({ ...d, config: { ...(d.config || {}), connectionString: e.target.value } }))} />
        </div>
        <div>
          <label>Query</label>
          <textarea rows={4} style={{ width: "100%" }} value={data.config?.query ?? ""} onChange={(e) => updateData((d: any) => ({ ...d, config: { ...(d.config || {}), query: e.target.value } }))} />
        </div>
      </div>
    );
  }
  if (type === "gql") {
    return (
      <div>
        <div>
          <label>Label</label>
          <input style={{ width: "100%" }} value={data.label ?? "GQL"} onChange={(e) => updateData((d: any) => ({ ...d, label: e.target.value }))} />
        </div>
        <div>
          <label>Endpoint</label>
          <input style={{ width: "100%" }} value={data.config?.endpoint ?? ""} onChange={(e) => updateData((d: any) => ({ ...d, config: { ...(d.config || {}), endpoint: e.target.value } }))} />
        </div>
        <div>
          <label>Type</label>
          <select style={{ width: "100%" }} value={data.config?.type ?? "query"} onChange={(e) => updateData((d: any) => ({ ...d, config: { ...(d.config || {}), type: e.target.value } }))}>
            <option>query</option>
            <option>mutation</option>
          </select>
        </div>
        <div>
          <label>GQL String</label>
          <textarea rows={8} style={{ width: "100%" }} value={data.config?.gqlString ?? ""} onChange={(e) => updateData((d: any) => ({ ...d, config: { ...(d.config || {}), gqlString: e.target.value } }))} />
        </div>
      </div>
    );
  }
  return (
    <div>
      <div>
        <label>Label</label>
        <input style={{ width: "100%" }} value={data.label ?? "Code"} onChange={(e) => updateData((d: any) => ({ ...d, label: e.target.value }))} />
      </div>
      <div>
        <label>Code</label>
        <textarea rows={8} style={{ width: "100%" }} value={data.config?.code ?? "return input;"} onChange={(e) => updateData((d: any) => ({ ...d, config: { ...(d.config || {}), code: e.target.value } }))} />
      </div>
    </div>
  );
}


