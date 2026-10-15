import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

const eslintConfig = [
  // Global ignores — must come first
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "next-env.d.ts",
      "db/**",
      "skills/**",
      "mini-services/**",
      "scripts/**",
      "agent-ctx/**",
      "worklog.md",
    ],
  },
  ...nextCoreWebVitals,
  ...nextTypescript,
  {
    rules: {
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/immutability": "off",
      "react-hooks/purity": "off",
      "@next/next/no-html-link-for-pages": "off",
      // The prebuilt lib files (api.ts, curriculum.ts, offline.ts, store.ts) use `any`
      // intentionally for flexible JSON payloads; we keep that pattern for compatibility.
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
    },
  },
];

export default eslintConfig;
