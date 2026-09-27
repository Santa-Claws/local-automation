import { describe, expect, it } from "vitest";
import { createSimulatedPaymentRail } from "../../simulation/payment-rail.js";

describe("simulated payment rail", () => {
  it("settles an approved payment exactly once and returns the original receipt on retry", () => {
    const rail = createSimulatedPaymentRail({
      payer: "0x1111111111111111111111111111111111111111",
      initialUsdcAtomic: 1_000_000n,
      now: () => 1_000,
    });
    const request = rail.quote({
      merchant: "0x2222222222222222222222222222222222222222",
      amountAtomic: 250_000n,
      expiresAt: 1_060,
      reference: "daily-brief",
    });

    const first = rail.pay(request);
    const retry = rail.pay(request);

    expect(first).toMatchObject({ status: "confirmed", amountAtomic: 250_000n, simulated: true });
    expect(retry).toEqual(first);
    expect(rail.getBalance()).toBe(750_000n);
    expect(rail.getMerchantBalance(request.merchant)).toBe(250_000n);
    expect(rail.getSettledPaymentCount()).toBe(1);
  });

  it("fails closed for expired, unfunded, and altered payment requests", () => {
    const rail = createSimulatedPaymentRail({
      payer: "0x1111111111111111111111111111111111111111",
      initialUsdcAtomic: 100n,
      now: () => 1_000,
    });
    const expired = rail.quote({
      merchant: "0x2222222222222222222222222222222222222222",
      amountAtomic: 1n,
      expiresAt: 999,
      reference: "expired",
    });
    const unaffordable = rail.quote({
      merchant: "0x2222222222222222222222222222222222222222",
      amountAtomic: 101n,
      expiresAt: 1_060,
      reference: "unfunded",
    });

    expect(() => rail.pay(expired)).toThrow("Payment request has expired");
    expect(() => rail.pay(unaffordable)).toThrow("Insufficient simulated USDC balance");
    expect(() => rail.pay({ ...unaffordable, amountAtomic: 1n })).toThrow("Payment request integrity check failed");
  });
});
