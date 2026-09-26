import type { InferenceToolCall, InferenceToolDefinition } from "../types.js";

const ACTIONS_PATTERN = /<actions>\s*(\[[\s\S]*?\])\s*<\/actions>/i;
const MAX_ACTIONS_PER_RESPONSE = 5;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * OpenRouter Hermes 3 is used without native function-calling metadata. This
 * parser maps a deliberately narrow, validated JSON envelope back into the
 * existing agent tool-call interface.
 */
export function parseStructuredActions(
  content: string,
  tools: InferenceToolDefinition[] | undefined,
): InferenceToolCall[] {
  if (!tools?.length) return [];
  const match = ACTIONS_PATTERN.exec(content);
  if (!match) return [];

  try {
    const raw = JSON.parse(match[1]) as unknown;
    if (!Array.isArray(raw) || raw.length > MAX_ACTIONS_PER_RESPONSE) return [];
    const allowed = new Set(tools.map((tool) => tool.function.name));
    const calls: InferenceToolCall[] = [];

    for (const [index, action] of raw.entries()) {
      if (!isRecord(action) || typeof action.tool !== "string" || !isRecord(action.arguments)) {
        return [];
      }
      if (!allowed.has(action.tool)) return [];
      calls.push({
        id: `structured-${index}`,
        type: "function",
        function: { name: action.tool, arguments: JSON.stringify(action.arguments) },
      });
    }
    return calls;
  } catch {
    return [];
  }
}

export function structuredActionInstruction(tools: InferenceToolDefinition[]): string {
  const capabilities = tools
    .map((tool) => `- ${tool.function.name}: ${tool.function.description || "No description"}`)
    .join("\n");
  return [
    "You may request tools only through this exact XML-delimited JSON envelope:",
    '<actions>[{"tool":"tool_name","arguments":{"key":"value"}}]</actions>',
    "Use only listed tool names, include at most five actions, and never include an action unless needed.",
    "Available tools:",
    capabilities,
  ].join("\n");
}
