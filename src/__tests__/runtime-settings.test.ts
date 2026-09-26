import { describe, expect, it } from "vitest";
import { resolveRuntimeSettings } from "../runtime/settings.js";

describe("runtime settings", () => {
  it("uses a local OpenRouter runtime without requiring Conway credentials", () => {
    expect(
      resolveRuntimeSettings(
        { workspaceRoot: "/srv/local-automation/workspace" },
        { OPENROUTER_API_KEY: "or-test-key" },
      ),
    ).toEqual({
      mode: "local",
      openrouterApiKey: "or-test-key",
      workspaceRoot: "/srv/local-automation/workspace",
    });
  });

  it("does not treat an empty environment value as an API key", () => {
    expect(
      resolveRuntimeSettings({ runtimeMode: "local" }, { OPENROUTER_API_KEY: "  " }),
    ).toEqual({ mode: "local", openrouterApiKey: undefined, workspaceRoot: "workspace" });
  });
});
