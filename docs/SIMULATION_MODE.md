# Simulation mode

Simulation mode is the development path when OpenRouter credentials and a funded Base wallet are unavailable.

It is **not** a production mode and it must never be represented as a successful on-chain payment or real model evaluation.

## Components

- `src/simulation/hermes3-client.ts` is a deterministic response queue that implements `InferenceClient`. Each scenario explicitly supplies the response, including any tool calls. It makes no HTTP request and does not claim to emulate hidden Hermes 3 reasoning.
- `src/simulation/payment-rail.ts` is an in-memory USDC ledger. It requires quoted payment requests, checks expiry and request integrity, settles each request once, and marks every receipt `simulated: true`.

## How Hermit participates

Hermit can author or review a scenario for a proposed prompt/action path, but the running application does not and cannot make an implicit RPC back into this chat. That separation is deliberate: tests must be reproducible and must not silently depend on a live assistant response.

## Required test coverage before a live adapter

1. Happy-path tool-use scenario.
2. Invalid/malformed structured action is rejected.
3. Unscripted inference request fails rather than inventing a response.
4. Payment succeeds once; retry returns the original receipt without another debit.
5. Expired, altered, duplicate, and insufficient-funds payments fail closed.
6. Inbound payment receipts are not treated as revenue until a verifier confirms them.
7. A no-egress test proves simulated runs do not access OpenRouter, RPC endpoints, or x402 merchants.

## Live promotion gate

A future OpenRouter, Base wallet, or x402 adapter must implement the same contract, pass the same tests, and be exercised separately on a user-approved testnet/small-budget flow. A simulated receipt or balance can never unlock a real spend action.
