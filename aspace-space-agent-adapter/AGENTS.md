# AGENTS

## Purpose

`aspace-space-agent-adapter/` owns the A'Space contract for the space-agent
fork (`Amdkn/space-agent`, pinned commit `10f4ffd`, version 0.36.0).
It is the only A'Space code in the fork: upstream files are byte-identical
(D-N048 H-M2).

## Ownership

This scope owns:

- `contract.json`: pinned commit, CLI surface, server contract, telemetry switches
- `smoke_test.mjs`: 4 `node:test` checks (contract pins, version, unknown
  command, server boot + `/api/health`)
- `README.md`: how to run the contract

## Local Contracts

- Server binds `127.0.0.1` only, `PORT=0` (ephemeral), state in a scratch
  `CUSTOMWARE_PATH` — never the checkout, never `0.0.0.0`.
- Never run `space update` or `space supervise` from this adapter.
- `SPACE_GITHUB_TOKEN` and `GIT_URL` stay unset.

## Work Guidance

- Keep the adapter lean: contract + smoke test + docs, no runtime code.
- Any change to the pinned commit requires a design amendment (D5),
  never a silent fast-forward.

## Verification

```sh
node --test aspace-space-agent-adapter/smoke_test.mjs
```

## Child DOX Index

- (none — no subfolders)

## DOX note

The root `AGENTS.md` (upstream) was intentionally left unchanged:
D-N048 H-M2 requires the upstream tree byte-identical except this
directory. This file is the local contract for the adapter boundary.
