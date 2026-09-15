import assert from "node:assert/strict";
import { ESLint } from "eslint";

// Lint in-memory TSX at a real consumer path. No invalid code enters the build.
const eslint = new ESLint();
const cases = [
  ["raw palette", "shadcn/no-raw-colors", '<div className="bg-red-500" />'],
  [
    "undeclared token",
    "shadcn/no-raw-colors",
    '<div className="bg-invented" />',
  ],
  [
    "arbitrary spacing",
    "shadcn/no-arbitrary-values",
    '<div className="p-[13px]" />',
  ],
  [
    "inline style",
    "shadcn/no-inline-styles",
    "<div style={{ padding: 13 }} />",
  ],
  [
    "unknown utility",
    "shadcn/no-unknown-classes",
    '<div className="flex-cols" />',
  ],
  [
    "unknown variant",
    "shadcn/no-unknown-classes",
    '<div className="hovr:flex" />',
  ],
  [
    "component restyling",
    "shadcn/no-restyle",
    '<Button className="p-8">Search</Button>',
  ],
  [
    "dynamic component class",
    "shadcn/require-static-classes",
    "<Button className={externalClass}>Search</Button>",
  ],
  [
    "card restyling",
    "shadcn/no-restyle",
    '<Card className="bg-primary">Evidence</Card>',
  ],
];
for (const [name, rule, jsx] of cases) {
  const [result] = await eslint.lintText(
    `import { Button } from './components/ui/button'; import { Card } from './components/ui/card'; export const Example = () => (${jsx});`,
    { filePath: "src/design-lint-probe.tsx" },
  );
  assert.ok(
    result.messages.some(
      (message) => message.ruleId === rule && message.severity === 2,
    ),
    `${name}: expected ${rule}, received ${JSON.stringify(result.messages)}`,
  );
}
const [valid] = await eslint.lintText(
  `import { Button } from './components/ui/button'; import { Card } from './components/ui/card'; export const Example = () => <div className="bg-background p-4"><Button variant="secondary" size="sm" className="w-full">Search</Button></div>;`,
  { filePath: "src/design-lint-probe.tsx" },
);
assert.equal(valid.messages.length, 0, JSON.stringify(valid.messages));
// Upstream layout exceptions are exact and cannot leak into page code.
const [consumerStructure] = await eslint.lintText(
  'export const Example = () => <div className="grid-rows-[auto_auto]" />;',
  { filePath: "src/design-lint-probe.tsx" },
);
assert.ok(
  consumerStructure.messages.some(
    (m) => m.ruleId === "shadcn/no-arbitrary-values" && m.severity === 2,
  ),
);
const [primitiveSpacing] = await eslint.lintText(
  'export const Example = () => <div className="p-[13px]" />;',
  { filePath: "src/components/ui/card.tsx" },
);
assert.ok(
  primitiveSpacing.messages.some(
    (m) => m.ruleId === "shadcn/no-arbitrary-values" && m.severity === 2,
  ),
);
const [upstreamStructure] = await eslint.lintText(
  'export const Example = () => <div className="grid-rows-[auto_auto]" />;',
  { filePath: "src/components/ui/card.tsx" },
);
assert.equal(
  upstreamStructure.messages.length,
  0,
  JSON.stringify(upstreamStructure.messages),
);
console.log(
  `Design lint verified: ${cases.length + 2} violations rejected; valid token and variant usage accepted.`,
);
