import fs from "fs";
import path from "path";
import { DEFAULT_MODEL_STRATEGY_CONFIG } from "../inference/types.js";
import { createLocalWallet, loadLocalWallet, localWalletExists } from "../identity/local-wallet.js";
import { DEFAULT_SOUL_CONFIG, DEFAULT_TREASURY_POLICY } from "../types.js";
import type { AutomatonConfig } from "../types.js";

export interface LocalRuntimeBootstrapOptions {
  stateDir: string;
  workspaceRoot: string;
  passphrase: string;
  name: string;
  genesisPrompt: string;
  creatorAddress?: string;
}

/**
 * Initialize the files required by the local runtime. Secrets deliberately
 * remain outside automaton.json: the OpenRouter key and wallet passphrase are
 * supplied at process start through systemd credentials/environment.
 */
export function initializeLocalRuntime(options: LocalRuntimeBootstrapOptions): AutomatonConfig {
  const stateDir = path.resolve(options.stateDir);
  const workspaceRoot = path.resolve(options.workspaceRoot);
  fs.mkdirSync(stateDir, { recursive: true, mode: 0o700 });
  fs.mkdirSync(workspaceRoot, { recursive: true, mode: 0o700 });

  const wallet = localWalletExists(stateDir)
    ? loadLocalWallet({ stateDir, passphrase: options.passphrase })
    : createLocalWallet({ stateDir, passphrase: options.passphrase });

  const config: AutomatonConfig = {
    name: options.name,
    genesisPrompt: options.genesisPrompt,
    creatorAddress: options.creatorAddress || "",
    registeredWithConway: false,
    sandboxId: "local",
    // Retained only for type compatibility while the legacy provider is removed.
    conwayApiUrl: "",
    conwayApiKey: "",
    runtimeMode: "local",
    workspaceRoot,
    inferenceModel: "nousresearch/hermes-3-llama-3.1-70b",
    maxTokensPerTurn: DEFAULT_MODEL_STRATEGY_CONFIG.maxTokensPerTurn,
    heartbeatConfigPath: path.join(stateDir, "heartbeat.yml"),
    dbPath: path.join(stateDir, "state.db"),
    logLevel: "info",
    walletAddress: wallet.address,
    version: "0.2.1-local.0",
    skillsDir: path.join(stateDir, "skills"),
    maxChildren: 3,
    treasuryPolicy: DEFAULT_TREASURY_POLICY,
    modelStrategy: {
      ...DEFAULT_MODEL_STRATEGY_CONFIG,
      inferenceModel: "nousresearch/hermes-3-llama-3.1-70b",
    },
    soulConfig: DEFAULT_SOUL_CONFIG,
    chainType: "evm",
  };

  const target = path.join(stateDir, "automaton.json");
  const temporary = `${target}.${process.pid}.tmp`;
  fs.writeFileSync(temporary, JSON.stringify(config, null, 2), { mode: 0o600 });
  fs.renameSync(temporary, target);
  fs.chmodSync(target, 0o600);
  return config;
}
