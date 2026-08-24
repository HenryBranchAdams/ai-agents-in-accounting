import identity from "./ledgerbench/identity.mjs";
import products from "./ledgerbench/products.mjs";
import tracks from "./ledgerbench/tracks.mjs";
import task_universe from "./ledgerbench/task-universe.mjs";
import capabilities from "./ledgerbench/capabilities.mjs";
import metrics from "./ledgerbench/metrics.mjs";
import admission from "./ledgerbench/admission.mjs";
import integrity from "./ledgerbench/integrity.mjs";
import submissions from "./ledgerbench/submissions.mjs";
import governance from "./ledgerbench/governance.mjs";
import precedents from "./ledgerbench/precedents.mjs";

export const ledgerBenchProgram = {
  ...identity,
  ...products,
  ...tracks,
  ...task_universe,
  ...capabilities,
  ...metrics,
  ...admission,
  ...integrity,
  ...submissions,
  ...governance,
  ...precedents,
};

export default ledgerBenchProgram;
