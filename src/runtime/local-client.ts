import { execFileSync } from "child_process";
import fs from "fs";
import path from "path";
import type {
  ConwayClient,
  CreateSandboxOptions,
  CreditTransferResult,
  DnsRecord,
  DomainRegistration,
  DomainSearchResult,
  ExecResult,
  ModelInfo,
  PortInfo,
  PricingTier,
  SandboxInfo,
} from "../types.js";

export interface LocalRuntimeClientOptions {
  /** Absolute directory that contains all agent-managed files. */
  workspaceRoot: string;
  /** Command execution is off by default; enable only inside the hardened LXC. */
  allowExec?: boolean;
  /** Human-readable local instance identifier. */
  instanceId?: string;
}

const HERMES_3_MODEL = "nousresearch/hermes-3-llama-3.1-70b";

class LocalCapabilityUnavailableError extends Error {
  constructor(capability: string) {
    super(`${capability} is unavailable in the local runtime provider`);
    this.name = "LocalCapabilityUnavailableError";
  }
}

function resolveWorkspacePath(workspaceRoot: string, requestedPath: string): string {
  if (!requestedPath || path.isAbsolute(requestedPath) || requestedPath.startsWith("~")) {
    throw new Error("Path is outside local workspace");
  }

  const resolved = path.resolve(workspaceRoot, requestedPath);
  if (resolved !== workspaceRoot && !resolved.startsWith(`${workspaceRoot}${path.sep}`)) {
    throw new Error("Path is outside local workspace");
  }
  return resolved;
}

export function createLocalRuntimeClient(options: LocalRuntimeClientOptions): ConwayClient {
  const workspaceRoot = path.resolve(options.workspaceRoot);
  const instanceId = options.instanceId || "local";
  fs.mkdirSync(workspaceRoot, { recursive: true, mode: 0o700 });

  const unavailable = (capability: string): never => {
    throw new LocalCapabilityUnavailableError(capability);
  };

  return {
    async exec(command: string, timeout?: number): Promise<ExecResult> {
      if (!options.allowExec) {
        return {
          stdout: "",
          stderr: "Command execution is disabled for this local runtime instance.",
          exitCode: 126,
        };
      }
      try {
        const stdout = execFileSync("/bin/sh", ["-lc", command], {
          cwd: workspaceRoot,
          encoding: "utf-8",
          timeout: timeout || 30_000,
          maxBuffer: 10 * 1024 * 1024,
        });
        return { stdout: stdout || "", stderr: "", exitCode: 0 };
      } catch (error: any) {
        return {
          stdout: error.stdout?.toString() || "",
          stderr: error.stderr?.toString() || error.message || "",
          exitCode: error.status ?? 1,
        };
      }
    },

    async writeFile(requestedPath: string, content: string): Promise<void> {
      const filePath = resolveWorkspacePath(workspaceRoot, requestedPath);
      fs.mkdirSync(path.dirname(filePath), { recursive: true, mode: 0o700 });
      fs.writeFileSync(filePath, content, { encoding: "utf-8", mode: 0o600 });
    },

    async readFile(requestedPath: string): Promise<string> {
      return fs.readFileSync(resolveWorkspacePath(workspaceRoot, requestedPath), "utf-8");
    },

    async exposePort(port: number): Promise<PortInfo> {
      return { port, publicUrl: `http://127.0.0.1:${port}`, sandboxId: instanceId };
    },

    async removePort(): Promise<void> {},

    async createSandbox(_options: CreateSandboxOptions): Promise<SandboxInfo> {
      return unavailable("Child sandbox provisioning");
    },

    async deleteSandbox(): Promise<void> {
      return unavailable("Child sandbox deletion");
    },

    async listSandboxes(): Promise<SandboxInfo[]> {
      return [];
    },

    async getCreditsBalance(): Promise<number> {
      return 0;
    },

    async getCreditsPricing(): Promise<PricingTier[]> {
      return [];
    },

    async transferCredits(_toAddress: string, _amountCents: number, _note?: string): Promise<CreditTransferResult> {
      return unavailable("Credit transfers");
    },

    async registerAutomaton(): Promise<{ automaton: Record<string, unknown> }> {
      return { automaton: { provider: "local", instanceId } };
    },

    async searchDomains(_query: string, _tlds?: string): Promise<DomainSearchResult[]> {
      return unavailable("Domain search");
    },

    async registerDomain(_domain: string, _years?: number): Promise<DomainRegistration> {
      return unavailable("Domain registration");
    },

    async listDnsRecords(_domain: string): Promise<DnsRecord[]> {
      return unavailable("DNS records");
    },

    async addDnsRecord(_domain: string, _type: string, _host: string, _value: string, _ttl?: number): Promise<DnsRecord> {
      return unavailable("DNS records");
    },

    async deleteDnsRecord(): Promise<void> {
      return unavailable("DNS records");
    },

    async listModels(): Promise<ModelInfo[]> {
      return [{
        id: HERMES_3_MODEL,
        provider: "openrouter",
        pricing: { inputPerMillion: 0.7, outputPerMillion: 0.7 },
      }];
    },

    createScopedClient(targetSandboxId: string): ConwayClient {
      if (targetSandboxId !== instanceId) {
        unavailable("Scoped sandbox access");
      }
      return createLocalRuntimeClient(options);
    },
  };
}
