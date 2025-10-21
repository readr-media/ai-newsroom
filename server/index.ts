import express from "express";
import cors from "cors";
import { WorkflowEngine } from "../src/engine/workflowEngine.js";
import type { WorkflowDefinition } from "../src/engine/types.js";
import { parseWorkflowJson } from "../src/engine/parser.js";
import { createConsoleLogger } from "../src/utils/logger.js";
import { writeFile } from "node:fs/promises";
import { readFile } from "node:fs/promises";
import { readdir } from "node:fs/promises";
import { unlink } from "node:fs/promises";

const app = express();
app.use(cors());
app.use(express.json({ limit: "2mb" }));

app.post("/run", async (req, res) => {
  try {
    const raw = req.body?.workflow;
    if (!raw) return res.status(400).json({ error: "Missing workflow" });
    const def = parseWorkflowJson(raw) as WorkflowDefinition;
    const input = req.body?.input ?? {};

    const engine = new WorkflowEngine({ logger: createConsoleLogger() });
    const out = await engine.run(def, input);
    res.json({ ok: true, output: out });
  } catch (e: any) {
    res.status(500).json({ ok: false, error: e?.message ?? String(e) });
  }
});

app.post("/save-workflow", async (req, res) => {
  try {
    const raw = req.body?.workflow;
    const name = req.body?.name;
    if (!raw) return res.status(400).json({ error: "Missing workflow" });
    if (!name) return res.status(400).json({ error: "Missing workflow name" });
    const def = parseWorkflowJson(raw) as WorkflowDefinition;
    await writeFile(`examples/${name}.json`, JSON.stringify(def, null, 2));
    res.json({ ok: true });
  } catch (e: any) {
    res.status(500).json({ ok: false, error: e?.message ?? String(e) });
  }
});

app.get("/load-workflow", async (req, res) => {
  try {
    const name = req.query?.name;
    if (!name) return res.status(400).json({ error: "Missing workflow name" });
    const raw = await readFile(`examples/${name}.json`, "utf-8");
    const workflow = JSON.parse(raw);
    res.json({ ok: true, workflow });
  } catch (e: any) {
    res.status(500).json({ ok: false, error: e?.message ?? String(e) });
  }
});

app.get("/list-workflows", async (req, res) => {
  try {
    const files = await readdir("examples/");
    const workflowNames = files
      .filter((file) => file.endsWith(".json"))
      .map((file) => file.replace(".json", ""));
    res.json({ ok: true, workflows: workflowNames });
  } catch (e: any) {
    res.status(500).json({ ok: false, error: e?.message ?? String(e) });
  }
});

app.delete("/delete-workflow", async (req, res) => {
  try {
    const name = req.query?.name as string;
    if (!name) return res.status(400).json({ ok: false, error: "Missing workflow name" });
    await unlink(`examples/${name}.json`);
    res.json({ ok: true });
  } catch (e: any) {
    if (e.code === 'ENOENT') {
      return res.status(404).json({ ok: false, error: `Workflow '${name}' not found.` });
    }
    res.status(500).json({ ok: false, error: e?.message ?? String(e) });
  }
});

const port = Number(process.env.PORT ?? 8787);
app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`Workflow server listening on http://localhost:${port}`);
});


