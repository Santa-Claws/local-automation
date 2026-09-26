import { afterEach, describe, expect, it, vi } from "vitest";
import { createInferenceClient } from "../conway/inference.js";

const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
  vi.restoreAllMocks();
});

describe("OpenRouter inference backend", () => {
  it("sends Hermes 3 requests to OpenRouter with bearer authentication and no native tools", async () => {
    const fetchSpy = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          id: "or-test-1",
          model: "nousresearch/hermes-3-llama-3.1-70b",
          choices: [{
            message: {
              role: "assistant",
              content: '<actions>[{"tool":"write_file","arguments":{"path":"note.txt","content":"ready"}}]</actions>',
            },
            finish_reason: "stop",
          }],
          usage: { prompt_tokens: 3, completion_tokens: 1, total_tokens: 4 },
        }),
        { status: 200, headers: { "content-type": "application/json" } },
      ),
    );
    globalThis.fetch = fetchSpy as typeof fetch;

    const client = createInferenceClient({
      apiUrl: "https://conway.invalid",
      apiKey: "must-not-be-used",
      openrouterApiKey: "or-test-key",
      defaultModel: "nousresearch/hermes-3-llama-3.1-70b",
      maxTokens: 128,
    });

    const response = await client.chat(
      [{ role: "user", content: "Say ready" }],
      {
        tools: [
          {
            type: "function",
            function: {
              name: "write_file",
              description: "write a file",
              parameters: { type: "object", properties: {} },
            },
          },
        ],
      },
    );

    expect(response.message.content).toContain("<actions>");
    expect(response.toolCalls).toEqual([
      expect.objectContaining({ function: { name: "write_file", arguments: '{"path":"note.txt","content":"ready"}' } }),
    ]);
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const [url, request] = fetchSpy.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://openrouter.ai/api/v1/chat/completions");
    expect(request.headers).toMatchObject({ Authorization: "Bearer or-test-key" });
    const body = JSON.parse(String(request.body));
    expect(body.model).toBe("nousresearch/hermes-3-llama-3.1-70b");
    expect(body.tools).toBeUndefined();
    expect(body.messages[0]).toMatchObject({ role: "system" });
    expect(body.messages[0].content).toContain("<actions>");
  });
});
