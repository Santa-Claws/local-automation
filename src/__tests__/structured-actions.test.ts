import { describe, expect, it } from "vitest";
import { parseStructuredActions, structuredActionInstruction } from "../agent/structured-actions.js";

describe("structured actions", () => {
  const tools = [
    { type: "function" as const, function: { name: "read_file", description: "read", parameters: { type: "object" } } },
    { type: "function" as const, function: { name: "write_file", description: "write", parameters: { type: "object" } } },
  ];

  it("turns a validated actions envelope into tool calls", () => {
    const parsed = parseStructuredActions(
      'I will inspect it.\n<actions>[{"tool":"read_file","arguments":{"path":"README.md"}}]</actions>',
      tools,
    );

    expect(parsed).toEqual([
      expect.objectContaining({
        type: "function",
        function: { name: "read_file", arguments: '{"path":"README.md"}' },
      }),
    ]);
  });

  it("rejects calls outside the advertised capability set", () => {
    expect(
      parseStructuredActions('<actions>[{"tool":"shell","arguments":{"command":"id"}}]</actions>', tools),
    ).toEqual([]);
  });

  it("instructs the model to use a bounded JSON-only action envelope", () => {
    expect(structuredActionInstruction(tools)).toContain("<actions>");
    expect(structuredActionInstruction(tools)).toContain("read_file");
  });
});
