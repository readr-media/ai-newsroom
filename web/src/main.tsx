import React from "react";
import { createRoot } from "react-dom/client";
import { App } from "./ui/App";
import "./styles.css";
import { ReactFlowProvider } from "reactflow";

const root = createRoot(document.getElementById("root")!);
root.render(
  <ReactFlowProvider>
    <App />
  </ReactFlowProvider>,
);


