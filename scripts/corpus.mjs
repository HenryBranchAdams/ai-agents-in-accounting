#!/usr/bin/env node
import {
  createCorpusClient,
  parseArguments,
  ConnectorError,
  connectorError,
} from "./agent-client.mjs";

try {
  const { positionals, flags } = parseArguments(process.argv.slice(2));
  const { help, pretty, base_url, ...args } = flags;
  if (help || !positionals.length) {
    process.stdout.write(
      `Accounting Agents — read-only corpus CLI\n\n  accounting-corpus describe\n  accounting-corpus search --q "bank reconciliation" --kind workflow\n  accounting-corpus get wf-r2r-bank-reconciliations --section data.control_model\n  accounting-corpus context --q "audit evidence" --max-chars 12000\n\nOptions: --base-url ORIGIN (otherwise bundled local snapshot), --pretty\nRepeat --ids for context IDs. Use --cursor with identical arguments to continue.\nPin --corpus-version for consistent reads. JSON goes to stdout; errors to stderr.\nFull arguments and bounds: describe, /schemas/agent.schema.json, docs/agent-access.md\n`,
    );
  } else {
    const [op, id, ...extra] = positionals;
    if (extra.length || (id && op !== "get") || (id && args.id))
      throw new ConnectorError(
        "INVALID_ARGUMENT",
        "Only get accepts one positional record ID.",
      );
    if (id) args.id = id;
    const result = await createCorpusClient({ baseUrl: base_url }).call(
      op,
      args,
    );
    process.stdout.write(
      JSON.stringify(result, null, pretty ? 2 : undefined) + "\n",
    );
  }
} catch (error) {
  process.stderr.write(JSON.stringify(connectorError(error)) + "\n");
  process.exitCode = 1;
}
