import fs from "fs";
import os from "os";
import path from "path";
import { afterEach, describe, expect, it } from "vitest";
import { createLocalWallet, loadLocalWallet } from "../identity/local-wallet.js";

const dirs: string[] = [];

afterEach(() => {
  for (const dir of dirs.splice(0)) fs.rmSync(dir, { recursive: true, force: true });
});

function stateDir(): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "local-automation-wallet-"));
  dirs.push(dir);
  return dir;
}

describe("encrypted local wallet", () => {
  it("persists an encrypted EVM key without writing its plaintext to disk", () => {
    const dir = stateDir();
    const created = createLocalWallet({ stateDir: dir, passphrase: "test-wallet-passphrase" });
    const walletPath = path.join(dir, "agent-wallet.json");
    const file = fs.readFileSync(walletPath, "utf-8");

    expect(created.address).toMatch(/^0x[0-9a-f]{40}$/i);
    expect(file).toContain('"version": 1');
    expect(file).not.toContain(created.privateKey);
    expect(loadLocalWallet({ stateDir: dir, passphrase: "test-wallet-passphrase" }).address).toBe(created.address);
    expect(() => loadLocalWallet({ stateDir: dir, passphrase: "wrong-passphrase" })).toThrow(
      "Unable to decrypt local wallet",
    );
  });
});
