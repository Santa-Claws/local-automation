# Local Automation

A self-hosted, wallet-owning autonomous agent runtime.

`local-automation` is a fork of Conway Automaton being rebuilt to operate without Conway Cloud or any Conway API. It is intended for deployment in a constrained local lab environment, with explicit controls around inference, wallet signing, paid services, infrastructure, replication, and self-modification.

## Status

> **Early development — not safe for production funds or public exposure.**

The repository is currently establishing its no-Conway runtime foundation. Do not run the inherited upstream setup wizard or fund an inherited wallet configuration.

## Design goals

- **Inference:** OpenRouter, initially `nousresearch/hermes-3-llama-3.1-70b`.
- **Identity and payments:** a dedicated encrypted Base/EVM wallet, independent of inference billing.
- **Economics:** record revenue only after confirmed on-chain USDC receipts; make only policy-bound payments.
- **Capabilities:** retain memory, heartbeats, skills, auditable self-modification, signed messaging, and replication through local-lab providers.
- **Profiles:** `offline`, `paper`, and `restricted-live`.
- **Isolation:** run in an unprivileged LXC with no host mounts and constrained egress.

## Development

```bash
pnpm install --frozen-lockfile
pnpm typecheck
pnpm test
pnpm build
```

See [docs/IMPLEMENTATION_CONTEXT.md](docs/IMPLEMENTATION_CONTEXT.md) for the compact design handoff and [UPSTREAM.md](UPSTREAM.md) for provenance.

## License

MIT. This project retains the upstream license and attribution; see [UPSTREAM.md](UPSTREAM.md).
