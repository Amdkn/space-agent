import assert from "node:assert/strict";
import { execFile, spawn } from "node:child_process";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const ADAPTER_DIR = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(ADAPTER_DIR, "..");

const CONTRACT = JSON.parse(
  await fs.readFile(path.join(ADAPTER_DIR, "contract.json"), "utf8")
);

function run(file, args, opts = {}) {
  return new Promise((resolve, reject) => {
    execFile(file, args, { cwd: REPO_ROOT, timeout: 30_000, ...opts }, (error, stdout, stderr) => {
      if (error) resolve({ code: error.code ?? 1, stdout: String(stdout), stderr: String(stderr) });
      else resolve({ code: 0, stdout: String(stdout), stderr: String(stderr) });
    });
  });
}

test("contract.json pins the frozen commit and version", async () => {
  assert.equal(CONTRACT.adapter.pinned_space_agent_commit.slice(0, 7), "10f4ffd");
  assert.equal(CONTRACT.adapter.pinned_space_agent_version, "0.36.0");
  assert.equal(CONTRACT.server.bind, "127.0.0.1 (never 0.0.0.0 in A'Space use)");
  const pkg = JSON.parse(await fs.readFile(path.join(REPO_ROOT, "package.json"), "utf8"));
  assert.equal(pkg.version, "0.36.0");
  // HEAD is the adapter commit; the gel is its single ancestor:
  // exactly one commit above the pinned commit, and the pin is an ancestor.
  const above = (await run("git", ["rev-list", "--count", `${CONTRACT.adapter.pinned_space_agent_commit}..HEAD`])).stdout.trim();
  assert.equal(above, "1");
  const parent = (await run("git", ["rev-parse", "HEAD~1"])).stdout.trim();
  assert.equal(parent, CONTRACT.adapter.pinned_space_agent_commit);
});

test("space --version prints the git-derived version (no tags in the fork)", async () => {
  // The fork was created with default_branch_only=true: 0 tags copied.
  // Upstream's latest tag is v0.66, but the fork has none, so the
  // git-derived version is v0.0 + total commits at HEAD. The version
  // pin is package.json 0.36.0 (checked above), not this string.
  const { code, stdout } = await run("node", ["space", "--version"]);
  assert.equal(code, 0);
  const count = (await run("git", ["rev-list", "--count", "HEAD"])).stdout.trim();
  assert.equal(stdout.trim(), `v0.0+${count}`);
});

test("unknown command exits non-zero", async () => {
  const { code } = await run("node", ["space", "no-such-command-xyz"]);
  assert.notEqual(code, 0);
});

test("server boots on 127.0.0.1 and /api/health answers", async (t) => {
  const scratch = await fs.mkdtemp(path.join(os.tmpdir(), "aspace-space-agent-"));
  t.after(async () => fs.rm(scratch, { recursive: true, force: true }));

  const child = spawn(
    "node",
    ["space", "serve", "HOST=127.0.0.1", "PORT=0", `CUSTOMWARE_PATH=${scratch}`],
    { cwd: REPO_ROOT, env: { ...process.env, SPACE_GITHUB_TOKEN: "", GIT_URL: "" } }
  );
  t.after(() => child.kill("SIGTERM"));

  const url = await new Promise((resolve, reject) => {
    let out = "";
    const timer = setTimeout(() => reject(new Error(`no listen line in 20s: ${out}`)), 20_000);
    child.stdout.on("data", (chunk) => {
      out += chunk;
      const m = out.match(/space server listening at (http:\/\/127\.0\.0\.1:\d+)/);
      if (m) {
        clearTimeout(timer);
        resolve(m[1]);
      }
    });
    child.stderr.on("data", (chunk) => { out += chunk; });
    child.on("exit", (code) => reject(new Error(`server exited ${code}: ${out}`)));
  });

  const res = await fetch(`${url}/api/health`);
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.ok, true);
  assert.equal(body.name, "space-agent-server");
});
