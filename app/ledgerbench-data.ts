import { ledgerBenchProgram } from "../data/ledgerbench-program.mjs";
import { ledgerBenchLinks } from "./ledgerbench/schema-common";

export { ledgerBenchProgram, ledgerBenchLinks };
export type LedgerBenchProgram = typeof ledgerBenchProgram;
export { ledgerBenchProgramSchema } from "./ledgerbench/program-schema";
export { ledgerBenchEpisodeSchema } from "./ledgerbench/episode-schema";
export { ledgerBenchResultSchema } from "./ledgerbench/result-schema";
export { ledgerBenchSubmissionSchema } from "./ledgerbench/submission-schema";
export { renderLedgerBenchMarkdown } from "./ledgerbench/render";

export const ledgerBenchApiRecord = {
  schema_version: "1.0",
  collection: "benchmark_program",
  item: ledgerBenchProgram,
  links: ledgerBenchLinks,
};
