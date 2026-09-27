export interface SimulatedPaymentRequest {
  id: string;
  merchant: string;
  amountAtomic: bigint;
  expiresAt: number;
  reference: string;
}

export interface SimulatedPaymentReceipt {
  id: string;
  requestId: string;
  payer: string;
  merchant: string;
  amountAtomic: bigint;
  status: "confirmed";
  simulated: true;
  settledAt: number;
}

export interface SimulatedPaymentRail {
  quote(input: Omit<SimulatedPaymentRequest, "id">): SimulatedPaymentRequest;
  pay(request: SimulatedPaymentRequest): SimulatedPaymentReceipt;
  getBalance(): bigint;
  getMerchantBalance(merchant: string): bigint;
  getSettledPaymentCount(): number;
}

export function createSimulatedPaymentRail(options: {
  payer: string;
  initialUsdcAtomic: bigint;
  now?: () => number;
}): SimulatedPaymentRail {
  const now = options.now || (() => Math.floor(Date.now() / 1000));
  let balance = options.initialUsdcAtomic;
  let nextId = 1;
  const issued = new Map<string, SimulatedPaymentRequest>();
  const receipts = new Map<string, SimulatedPaymentReceipt>();
  const merchantBalances = new Map<string, bigint>();

  function sameRequest(a: SimulatedPaymentRequest, b: SimulatedPaymentRequest): boolean {
    return a.id === b.id
      && a.merchant === b.merchant
      && a.amountAtomic === b.amountAtomic
      && a.expiresAt === b.expiresAt
      && a.reference === b.reference;
  }

  return {
    quote(input) {
      if (input.amountAtomic <= 0n) throw new Error("Payment amount must be positive");
      if (!input.merchant) throw new Error("Payment merchant is required");
      const request: SimulatedPaymentRequest = { ...input, id: `sim-payment-${nextId++}` };
      issued.set(request.id, request);
      return Object.freeze({ ...request });
    },

    pay(request) {
      const issuedRequest = issued.get(request.id);
      if (!issuedRequest || !sameRequest(issuedRequest, request)) {
        throw new Error("Payment request integrity check failed");
      }
      const existing = receipts.get(request.id);
      if (existing) return existing;
      if (request.expiresAt <= now()) throw new Error("Payment request has expired");
      if (balance < request.amountAtomic) throw new Error("Insufficient simulated USDC balance");

      balance -= request.amountAtomic;
      merchantBalances.set(
        request.merchant,
        (merchantBalances.get(request.merchant) || 0n) + request.amountAtomic,
      );
      const receipt: SimulatedPaymentReceipt = Object.freeze({
        id: `sim-receipt-${request.id}`,
        requestId: request.id,
        payer: options.payer,
        merchant: request.merchant,
        amountAtomic: request.amountAtomic,
        status: "confirmed",
        simulated: true,
        settledAt: now(),
      });
      receipts.set(request.id, receipt);
      return receipt;
    },

    getBalance: () => balance,
    getMerchantBalance: (merchant) => merchantBalances.get(merchant) || 0n,
    getSettledPaymentCount: () => receipts.size,
  };
}
