# Local Automation — Compact Implementation Context

## Goal
Build a self-hosted fork of Conway Automaton that retains agent, wallet, payment, memory, heartbeat, skills, self-modification, social, and replication capabilities while making no Conway API call.

## Pinned upstream
- Source: `Conway-Research/automaton`
- Baseline: `d8f816881fd2`
- Fork: `https://github.com/Santa-Claws/local-automation`
- Work branch: `feat/local-runtime-foundation`

## Product decisions
- Inference: OpenRouter only; default `nousresearch/hermes-3-llama-3.1-70b`.
- Tool use: schema-validated structured actions, not assumed native function calling.
- Wallet: dedicated encrypted Base/EVM agent wallet; no raw private key in state/config/logs/prompts.
- Modes: `offline`, `paper`, and `restricted-live`.
- Payments: wallet can receive USDC and make only policy-bound x402 payments; live spending requires strict caps, chain/token/recipient/domain allowlists, idempotency, reconciliation, and audit records.
- Revenue: count only confirmed on-chain receipts. Initial earning mechanism is a bounded, x402-protected service endpoint.
- Infrastructure: local lab provider replaces Conway sandboxes; child agents use tightly scoped local workers or Proxmox LXC templates.
- Deployment: fresh unprivileged LXC on Alfred3; no host mounts, no root SSH/PVE credentials, no privileged nesting.

## Prior-art notes
- Upstream PR #370 is a partial local-inference reference; it leaves Conway lifecycle dependencies intact.
- Upstream PR #363 is a restricted-live/payment-proposal reference; manually port tested concepts only.
- Before live x402, address upstream issue classes: duplicate charge retries, SSRF, and paid-result prompt injection.

## Immediate implementation order
1. Establish no-Conway startup and test contract.
2. Add OpenRouter client + structured-action adapter.
3. Add encrypted wallet/treasury and mocked payment lifecycle.
4. Replace Conway sandbox/social/replication APIs with local providers.
5. Deploy paper mode; activate restricted-live features one at a time after tests and explicit funding policy.
