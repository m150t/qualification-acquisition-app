import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const restrictedClientImports = [
  "@/lib/dynamodb",
  "@/lib/authServer",
];

function hasUseClientDirective(program) {
  for (const statement of program.body) {
    if (statement.type !== "ExpressionStatement" || !statement.directive) {
      return false;
    }

    if (statement.directive === "use client") {
      return true;
    }
  }

  return false;
}

function isServerOnlyImport(importPath) {
  return (
    restrictedClientImports.includes(importPath) ||
    importPath.startsWith("@/lib/ai/") ||
    /^@\/features\/.+\/server\/.+/.test(importPath)
  );
}

const noClientServerImportsRule = {
  meta: {
    type: "problem",
    docs: {
      description: "Disallow server-only imports from Client Components.",
    },
    schema: [],
    messages: {
      serverOnlyImport:
        'Client Components must not import server-only module "{{importPath}}".',
    },
  },
  create(context) {
    let isClientComponent = false;

    return {
      Program(program) {
        isClientComponent = hasUseClientDirective(program);
      },
      ImportDeclaration(node) {
        const importPath = node.source.value;

        if (
          !isClientComponent ||
          typeof importPath !== "string" ||
          !isServerOnlyImport(importPath)
        ) {
          return;
        }

        context.report({
          node: node.source,
          messageId: "serverOnlyImport",
          data: { importPath },
        });
      },
    };
  },
};

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  {
    files: ["src/**/*.{ts,tsx}"],
    plugins: {
      qualog: {
        rules: {
          "no-client-server-imports": noClientServerImportsRule,
        },
      },
    },
    rules: {
      "qualog/no-client-server-imports": "error",
    },
  },
  {
    rules: {
      "@typescript-eslint/ban-ts-comment": [
        "error",
        { "ts-expect-error": "allow-with-description" },
      ],
      "@typescript-eslint/consistent-type-imports": [
        "error",
        { prefer: "type-imports" },
      ],
      "@typescript-eslint/no-explicit-any": "error",
    },
  },
]);

export default eslintConfig;
