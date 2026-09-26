export type RuntimeMode = "local" | "conway";

export interface RuntimeSettingsInput {
  runtimeMode?: RuntimeMode;
  openrouterApiKey?: string;
  workspaceRoot?: string;
}

export interface RuntimeSettings {
  mode: RuntimeMode;
  openrouterApiKey?: string;
  workspaceRoot: string;
}

function nonEmpty(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed || undefined;
}

/**
 * Resolve settings that select the execution and inference provider.
 * Local mode is deliberately the default so a config cannot silently invoke
 * the legacy Conway control plane.
 */
export function resolveRuntimeSettings(
  config: RuntimeSettingsInput,
  environment: NodeJS.ProcessEnv = process.env,
): RuntimeSettings {
  const mode = config.runtimeMode || "local";
  return {
    mode,
    openrouterApiKey: nonEmpty(environment.OPENROUTER_API_KEY) || nonEmpty(config.openrouterApiKey),
    workspaceRoot: nonEmpty(config.workspaceRoot) || "workspace",
  };
}
