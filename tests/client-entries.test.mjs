import test from "node:test";
import assert from "node:assert/strict";
import { clientEntryUrl } from "../scripts/client-entries.mjs";

test("browser entry selection ignores reordered shared and lazy chunks", () => {
  const outputs = {
    "dist/client/assets/chunk-react.js": { imports: [] },
    "dist/client/assets/search.js": { entryPoint: "src/client/search.tsx" },
    "dist/client/assets/navigation-ABC.js": { entryPoint: "src/client/navigation.tsx" },
    "dist/client/assets/navigation-ABC.js.map": {},
  };
  for (const entries of [Object.entries(outputs), Object.entries(outputs).reverse()]) {
    assert.equal(clientEntryUrl({ outputs: Object.fromEntries(entries) }, "src/client/navigation.tsx"), "/assets/navigation-ABC.js");
  }
});

test("missing, duplicate and out-of-directory browser entries fail closed", () => {
  const entryPoint = "src/client/navigation.tsx";
  assert.throws(() => clientEntryUrl({ outputs: {} }, entryPoint), /found 0/);
  assert.throws(() => clientEntryUrl({ outputs: {
    "dist/client/assets/a.js": { entryPoint }, "dist/client/assets/b.js": { entryPoint },
  } }, entryPoint), /found 2/);
  assert.throws(() => clientEntryUrl({ outputs: { "dist/server/a.js": { entryPoint } } }, entryPoint), /escapes/);
});
