import fs from "fs";
import os from "os";
import path from "path";
import { afterEach, describe, expect, it } from "vitest";
import { createLocalRuntimeClient } from "../runtime/local-client.js";

const workspaces: string[] = [];

afterEach(() => {
  for (const workspace of workspaces.splice(0)) {
    fs.rmSync(workspace, { recursive: true, force: true });
  }
});

function workspace(): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "local-automation-runtime-"));
  workspaces.push(dir);
  return dir;
}

describe("local runtime client", () => {
  it("confines file operations to its configured workspace", async () => {
    const root = workspace();
    const client = createLocalRuntimeClient({ workspaceRoot: root });

    await client.writeFile("reports/hello.txt", "local only");

    await expect(client.readFile("reports/hello.txt")).resolves.toBe("local only");
    await expect(client.writeFile("../outside.txt", "blocked")).rejects.toThrow(
      "outside local workspace",
    );
    expect(fs.existsSync(path.join(path.dirname(root), "outside.txt"))).toBe(false);
  });

  it("reports local model metadata without calling a remote control plane", async () => {
    const client = createLocalRuntimeClient({ workspaceRoot: workspace() });

    await expect(client.listModels()).resolves.toEqual([
      expect.objectContaining({
        id: "nousresearch/hermes-3-llama-3.1-70b",
        provider: "openrouter",
      }),
    ]);
    await expect(client.getCreditsBalance()).resolves.toBe(0);
  });
});
