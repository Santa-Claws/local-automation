import fs from "fs";
import os from "os";
import path from "path";
import { afterEach, describe, expect, it } from "vitest";
import { initializeLocalRuntime } from "../runtime/local-bootstrap.js";

const dirs: string[] = [];

afterEach(() => {
  for (const dir of dirs.splice(0)) fs.rmSync(dir, { recursive: true, force: true });
});

function tempDir(prefix: string): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), prefix));
  dirs.push(dir);
  return dir;
}

describe("local runtime bootstrap", () => {
  it("creates a non-secret local config and encrypted wallet in a dedicated state directory", () => {
    const stateDir = tempDir("local-automation-state-");
    const workspaceRoot = tempDir("local-automation-workspace-");

    const config = initializeLocalRuntime({
      stateDir,
      workspaceRoot,
      passphrase: "local-test-wallet-passphrase",
      name: "lab-agent",
      genesisPrompt: "Work only in the configured workspace.",
    });

    const configFile = fs.readFileSync(path.join(stateDir, "automaton.json"), "utf8");
    expect(config.runtimeMode).toBe("local");
    expect(config.walletAddress).toMatch(/^0x[0-9a-f]{40}$/i);
    expect(configFile).toContain('"runtimeMode": "local"');
    expect(configFile).not.toContain("local-test-wallet-passphrase");
    expect(fs.readFileSync(path.join(stateDir, "agent-wallet.json"), "utf8")).not.toContain('"privateKey"');
  });
});
