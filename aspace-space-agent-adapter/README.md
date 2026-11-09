# aspace-space-agent-adapter — A'Space contract for space-agent (D-N048 V2, FKB03)

Adapter-only code. The upstream repo (`agent0ai/space-agent`, MIT) is byte-identical
except this directory. Pinned commit: `10f4ffd` (gel §2, HEAD of `main` 2026-06-08,
no drift at the first named revisit, D5).

## What space-agent is

Browser-first AI agent with a thin Node.js server (`node space serve`).
Version 0.36.0, Node >= 20. No telemetry SDK in the dependency tree
(no posthog / segment / sentry / amplitude / mixpanel in `package-lock.json`).

## Contract (`contract.json`)

- **CLI**: `node space --version` → `v0.0+<commits>` in the fork (git-derived: no tags
  copied at fork creation; upstream's latest tag is v0.66 — the version pin is
  package.json 0.36.0, not this string); `node space help`; `node space serve
  HOST=127.0.0.1 PORT=0 CUSTOMWARE_PATH=<scratch>` (ephemeral port, URL printed
  as `space server listening at http://127.0.0.1:<port>`).
- **Server**: binds 127.0.0.1 only in A'Space use (default upstream is 0.0.0.0 —
  never used here). `GET /api/health` is anonymous and returns
  `{ok: true, name: "space-agent-server", ...}`.
- **State**: `CUSTOMWARE_PATH` points at a scratch dir, never the checkout.
- **Never**: `space update` (explicit CLI update, fetches a remote — user-initiated
  only, never invoked by the adapter); `space supervise` (out of scope).
- **Env**: `SPACE_GITHUB_TOKEN` unset (no GitHub auth header without it);
  `GIT_URL` unset (update remote falls back to local origin, never contacted
  by the adapter). `electron-updater` lives in `packaging/desktop` only —
  never in the thin server. No outbound call at boot; proxy + update paths
  are user-initiated only.

## Smoke test

```sh
node --test aspace-space-agent-adapter/smoke_test.mjs
```

4 tests: contract pins commit + version, `space --version`, unknown command
exits non-zero, server boots on 127.0.0.1 and `/api/health` answers.

## DOX note

Per the DOX closeout rule, docs intentionally left unchanged: the root
`AGENTS.md` (upstream file) was NOT edited — D-N048 H-M2 requires the
upstream tree byte-identical except this adapter directory. This folder
carries its own `AGENTS.md` as the local contract.
