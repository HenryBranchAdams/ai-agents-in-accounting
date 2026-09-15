import { plugin as shadcn } from "@shadcn/lint";
import tsParser from "@typescript-eslint/parser";
export default [
  {
    files: ["src/**/*.{ts,tsx}"],
    languageOptions: {
      parser: tsParser,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    plugins: { shadcn },
    linterOptions: { reportUnusedDisableDirectives: "error" },
    settings: {
      shadcn: {
        ui: "@/components/ui",
        componentImports: ["(^|/)ui/"],
        note: "Use the shared tokens and variants described in docs/design-system.md.",
      },
    },
    rules: {
      "shadcn/no-restyle": [
        "error",
        {
          allow: ["layout"],
          contracts: [
            { pattern: "^Button$", allow: ["w-full", "mt-*", "mb-*"] },
          ],
        },
      ],
      "shadcn/no-raw-colors": "error",
      "shadcn/no-arbitrary-values": "error",
      "shadcn/no-inline-styles": "error",
      "shadcn/no-unknown-classes": "error",
      "shadcn/require-static-classes": "error",
    },
  },
  {
    files: ["src/components/ui/**"],
    rules: {
      "shadcn/no-restyle": "off",
      "shadcn/require-static-classes": "off",
    },
  },
  // Exact upstream structural values, confined to the components that need them.
  {
    files: [
      "src/components/ui/{badge,input,native-select,navigation-menu}.tsx",
    ],
    rules: {
      "shadcn/no-arbitrary-values": [
        "error",
        { allow: ["transition-[color,box-shadow]"] },
      ],
    },
  },
  {
    files: ["src/components/ui/card.tsx"],
    rules: {
      "shadcn/no-arbitrary-values": [
        "error",
        { allow: ["grid-rows-[auto_auto]", "grid-cols-[1fr_auto]"] },
      ],
    },
  },
  {
    files: ["src/components/ui/alert.tsx"],
    rules: {
      "shadcn/no-arbitrary-values": [
        "error",
        {
          allow: [
            "grid-cols-[0_1fr]",
            "grid-cols-[calc(var(--spacing)*4)_1fr]",
          ],
        },
      ],
    },
  },
];
