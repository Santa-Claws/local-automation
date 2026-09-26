import { describe, expect, it } from "vitest";
import { DEFAULT_TREASURY_POLICY } from "../types.js";

describe("local treasury defaults", () => {
  it("starts with outbound x402 payments disabled until an operator explicitly enables a domain", () => {
    expect(DEFAULT_TREASURY_POLICY.x402AllowedDomains).toEqual([]);
    expect(DEFAULT_TREASURY_POLICY.maxX402PaymentCents).toBe(0);
  });
});
