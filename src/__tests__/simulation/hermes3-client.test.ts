import { describe, expect, it } from "vitest";
import { createScriptedHermes3Client } from "../../simulation/hermes3-client.js";

describe("scripted Hermes 3 client", () => {
  it("replays a bounded tool-use scenario and rejects unscripted requests", async () => {
    const client = createScriptedHermes3Client([
      {
        expectUserText: "inspect the workspace",
        response: {
          content: '<actions>[{"tool":"read_file","arguments":{"path":"README.md"}}]</actions>',
          toolCalls: [{
            id: "scenario-1",
            type: "function",
            function: { name: "read_file", arguments: '{"path":"README.md"}' },
          }],
        },
      },
    ]);

    const response = await client.chat([{ role: "user", content: "inspect the workspace" }]);

    expect(response.toolCalls?.[0]?.function.name).toBe("read_file");
    expect(client.assertExhausted()).toBeUndefined();
    await expect(client.chat([{ role: "user", content: "another request" }])).rejects.toThrow(
      "No scripted Hermes 3 response remains",
    );
  });
});
