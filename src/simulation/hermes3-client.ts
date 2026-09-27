import type {
  ChatMessage,
  InferenceClient,
  InferenceOptions,
  InferenceResponse,
  InferenceToolCall,
} from "../types.js";

export interface Hermes3ScenarioStep {
  expectUserText?: string;
  response: {
    content: string;
    toolCalls?: InferenceToolCall[];
  };
}

export interface ScriptedHermes3Client extends InferenceClient {
  assertExhausted(): void;
}

/**
 * Deterministic stand-in for Hermit-authored Hermes 3 acceptance scenarios.
 * It never sends a model request; every expected response must be supplied by
 * the test so simulator behavior cannot be mistaken for model capability.
 */
export function createScriptedHermes3Client(
  steps: Hermes3ScenarioStep[],
  model = "simulated/nousresearch-hermes-3-llama-3.1-70b",
): ScriptedHermes3Client {
  const pending = [...steps];
  let lowCompute = false;

  return {
    async chat(messages: ChatMessage[], _options?: InferenceOptions): Promise<InferenceResponse> {
      const step = pending.shift();
      if (!step) throw new Error("No scripted Hermes 3 response remains");
      const userContent = [...messages].reverse().find((message) => message.role === "user")?.content || "";
      if (step.expectUserText && !userContent.includes(step.expectUserText)) {
        throw new Error(`Scripted Hermes 3 expectation failed: expected user text containing "${step.expectUserText}"`);
      }
      return {
        id: `simulated-hermes3-${steps.length - pending.length}`,
        model,
        message: {
          role: "assistant",
          content: step.response.content,
          tool_calls: step.response.toolCalls,
        },
        toolCalls: step.response.toolCalls,
        usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
        finishReason: "stop",
      };
    },
    setLowComputeMode(enabled: boolean) {
      lowCompute = enabled;
    },
    getDefaultModel() {
      return lowCompute ? `${model}:low-compute` : model;
    },
    assertExhausted() {
      if (pending.length) throw new Error(`${pending.length} scripted Hermes 3 response(s) were not consumed`);
    },
  };
}
