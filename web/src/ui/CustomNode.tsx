import React from "react";
import { Handle, Position } from "reactflow";

interface CustomNodeProps {
  data: {
    label: string;
    type: string;
    icon?: React.ReactNode;
  };
}

export const CustomNode: React.FC<CustomNodeProps> = ({ data }) => {
  const bgColor = getNodeColor(data.type);

  return (
    <div
      style={{
        border: `1px solid ${bgColor}`,
        borderRadius: "4px",
        padding: "10px 15px",
        background: "#fff",
        display: "flex",
        alignItems: "center",
        gap: "8px",
        minWidth: "120px",
      }}
    >
      <Handle type="target" position={Position.Left} />
      {data.icon && <div style={{ fontSize: "1.2em" }}>{data.icon}</div>}
      <div>{data.label}</div>
      <Handle type="source" position={Position.Right} />
    </div>
  );
};

function getNodeColor(type: string): string {
  switch (type) {
    case "http":
      return "#4CAF50"; // Green
    case "delay":
      return "#FFC107"; // Amber
    case "code":
      return "#2196F3"; // Blue
    case "mcp":
      return "#9C27B0"; // Purple
    default:
      return "#607D8B"; // Grey
  }
}
