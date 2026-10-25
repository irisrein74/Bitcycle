#!/usr/bin/env node
import { spawn } from "node:child_process";
import { loadEnvFile } from "./load-env.mjs";

loadEnvFile();

const [command, ...args] = process.argv.slice(2);
if (!command) {
  console.error("usage: node scripts/run.mjs <command> [args…]");
  process.exit(2);
}

const child = spawn(command, args, {
  stdio: "inherit",
  env: process.env,
  shell: process.platform === "win32",
});

for (const signal of ["SIGINT", "SIGTERM", "SIGHUP"]) {
  process.on(signal, () => child.kill(signal));
}

child.on("error", (err) => {
  console.error(`[run] failed to start ${command}:`, err?.message ?? err);
  process.exit(127);
});

child.on("exit", (code, signal) => {
  if (signal) process.exit(128);
  process.exit(code ?? 1);
});
