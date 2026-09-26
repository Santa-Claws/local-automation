import { describe, expect, it } from "vitest";
import { DEFAULT_CONFIG } from "../types.js";
import { DEFAULT_MODEL_STRATEGY_CONFIG } from "../inference/types.js";

const HERMES_3 = "nousresearch/hermes-3-llama-3.1-70b";

describe("local runtime defaults", () => {
  it("selects the OpenRouter Hermes 3 model for normal operation", () => {
    expect(DEFAULT_CONFIG.inferenceModel).toBe(HERMES_3);
    expect(DEFAULT_MODEL_STRATEGY_CONFIG.inferenceModel).toBe(HERMES_3);
  });
});
