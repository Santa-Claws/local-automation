import { describe, expect, it } from "vitest";
import { STATIC_MODEL_BASELINE } from "../inference/types.js";

describe("local inference model baseline", () => {
  it("registers the configured OpenRouter Hermes 3 model without native tools", () => {
    expect(STATIC_MODEL_BASELINE).toContainEqual(
      expect.objectContaining({
        modelId: "nousresearch/hermes-3-llama-3.1-70b",
        provider: "openrouter",
        contextWindow: 131072,
        supportsTools: false,
      }),
    );
  });
});
