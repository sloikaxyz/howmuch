const path = require("path");

/** @type {import("eslint").Linter.Config} */
const config = {
  overrides: [
    {
      extends: [
        "plugin:@typescript-eslint/recommended-requiring-type-checking",
      ],
      files: ["*.ts", "*.tsx"],
      parserOptions: {
        project: path.join(__dirname, "tsconfig.json"),
      },
      rules: {
        "@typescript-eslint/consistent-type-exports": [
          "warn",
          { fixMixedExportsWithInlineTypeSpecifier: true },
        ],
        "@typescript-eslint/no-unnecessary-condition": [
          "error",
          { allowConstantLoopConditions: true },
        ],
      },
    },
    {
      files: ["*.cjs"],
      rules: {
        "@typescript-eslint/no-var-requires": "off",
      },
    },
  ],
  parser: "@typescript-eslint/parser",
  parserOptions: {
    project: path.join(__dirname, "tsconfig.json"),
  },
  plugins: ["@typescript-eslint"],
  extends: [
    "next/core-web-vitals",
    "plugin:@typescript-eslint/recommended",
    "plugin:@tanstack/eslint-plugin-query/recommended",
    "plugin:tailwindcss/recommended",
    "plugin:prettier/recommended",
  ],
  rules: {
    "@tanstack/query/exhaustive-deps": "error",
    "@tanstack/query/prefer-query-object-syntax": "error",
    "@typescript-eslint/consistent-type-assertions": [
      "error",
      { assertionStyle: "never" },
    ],
    "@typescript-eslint/consistent-type-imports": [
      "warn",
      {
        prefer: "type-imports",
        fixStyle: "inline-type-imports",
      },
    ],
    "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
    "import/first": "error",
    "import/no-duplicates": "error",
    "import/order": [
      "error",
      {
        groups: [
          "builtin",
          "external",
          "internal",
          "parent",
          "sibling",
          "index",
        ],
        pathGroups: [
          {
            pattern: "~/**",
            group: "internal",
            position: "after",
          },
        ],
        alphabetize: {
          order: "asc",
          caseInsensitive: true,
        },
        "newlines-between": "always",
      },
    ],
    "no-console": [
      "warn",
      {
        allow: ["warn", "error"],
      },
    ],
    "react/jsx-curly-brace-presence": "warn",
  },
};

module.exports = config;
