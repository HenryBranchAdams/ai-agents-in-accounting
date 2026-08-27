#!/usr/bin/env node

import { spawn } from "node:child_process";

function durationMs(value, option) {
  const match = /^(\d+(?:\.\d+)?)(ms|s|m|h|d)?$/i.exec(value);
  if (!match) throw new Error(`${option} must be a positive duration such as 500ms, 10s, or 3m.`);
  const multipliers = { ms: 1, s: 1_000, m: 60_000, h: 3_600_000, d: 86_400_000 };
  const milliseconds = Number(match[1]) * multipliers[(match[2] ?? "s").toLowerCase()];
  if (!Number.isFinite(milliseconds) || milliseconds <= 0) {
    throw new Error(`${option} must be greater than zero.`);
  }
  return milliseconds;
}

function optionValue(options, name) {
  const prefix = `${name}=`;
  const option = options.find((value) => value.startsWith(prefix));
  if (!option) throw new Error(`${name} is required.`);
  return option.slice(prefix.length);
}

const separator = process.argv.indexOf("--");
if (separator < 0 || separator === process.argv.length - 1) {
  console.error("usage: run-with-timeout.mjs --timeout=DURATION --kill-after=DURATION -- command [args...]");
  process.exit(64);
}

const options = process.argv.slice(2, separator);
const [command, ...args] = process.argv.slice(separator + 1);

let timeoutMs;
let killAfterMs;
try {
  timeoutMs = durationMs(optionValue(options, "--timeout"), "--timeout");
  killAfterMs = durationMs(optionValue(options, "--kill-after"), "--kill-after");
} catch (error) {
  console.error(error.message);
  process.exit(64);
}

const child = spawn(command, args, { stdio: "inherit" });
let deadlineExpired = false;
let killTimer;

const deadlineTimer = setTimeout(() => {
  deadlineExpired = true;
  child.kill("SIGTERM");
  killTimer = setTimeout(() => child.kill("SIGKILL"), killAfterMs);
}, timeoutMs);

const outcome = await new Promise((resolve) => {
  child.once("error", (error) => resolve({ error }));
  child.once("close", (code, signal) => resolve({ code, signal }));
});

clearTimeout(deadlineTimer);
clearTimeout(killTimer);

if (outcome.error) {
  console.error(`Unable to start ${command}: ${outcome.error.message}`);
  process.exit(69);
}

if (deadlineExpired) process.exit(124);
if (outcome.code !== null) process.exit(outcome.code);
console.error(`${command} exited after signal ${outcome.signal ?? "unknown"}.`);
process.exit(1);
