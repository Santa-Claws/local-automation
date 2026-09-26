# Upstream provenance

`local-automation` was initialized from:

- Repository: <https://github.com/Conway-Research/automaton>
- Pinned source commit: `d8f816881fd2`
- License: MIT

The upstream remote is retained as `upstream` for review-only comparison. This fork is intentionally not API-compatible with Conway Cloud and must not make Conway network calls at runtime.

## Divergence policy

- Upstream commits are reviewed individually before adoption.
- Any imported behavior must pass this repository's offline and restricted-live test suites.
- No imported update may reintroduce Conway provisioning, inference, credits, sandbox control, social relay, or automatic top-up behavior.
- Wallet/payment code is treated as security-sensitive and cannot be adopted without dedicated tests and a policy review.

## Useful upstream references

- PR #370: local/NIM inference experiment; reference only because it retains the Conway lifecycle.
- PR #363: safe-local and restricted-live payment-proposal patterns; reference only, manually port tested concepts.
- Issues #393, #394, and #395: duplicate x402 charge, SSRF, and prompt-injection classes that must be resolved before live payments.
