#!/usr/bin/env node
import { AccountingAgentsClient } from "../clients/javascript/accounting-agents.mjs";

const [command, ...args] = process.argv.slice(2);
const client = new AccountingAgentsClient({ origin: process.env.ACCOUNTING_AGENTS_ORIGIN });

function usage() {
  process.stderr.write(`Usage:
  accounting-agents search <query>
  accounting-agents packs
  accounting-agents pack <id>
  accounting-agents benchmark [pack-id]
  accounting-agents workflows [query]
  accounting-agents meta
`);
}

try {
  let result;
  if (command === "search" && args.length) result = await client.search(args.join(" "));
  else if (command === "packs") result = await client.packs({ limit: 200 });
  else if (command === "pack" && args[0]) result = await client.pack(args[0]);
  else if (command === "benchmark") result = await client.benchmark({ pack: args[0], limit: 200 });
  else if (command === "workflows") result = await client.workflows({ q: args.join(" "), limit: 200 });
  else if (command === "meta") result = await client.meta();
  else {
    usage();
    process.exitCode = 2;
  }
  if (result) process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
} catch (error) {
  process.stderr.write(`${error.message}\n`);
  process.exitCode = 1;
}
