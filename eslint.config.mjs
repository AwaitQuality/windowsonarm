import coreWebVitals from "eslint-config-next/core-web-vitals";

/**
 * Flat config: Next 16 removed `next lint`, and eslint-config-next 16 requires
 * ESLint 9, which no longer reads .eslintrc.json. Run with `pnpm lint`.
 */
export default [
  {
    ignores: [
      ".next/**",
      ".open-next/**",
      ".wrangler/**",
      "lib/generated/**",
      "node_modules/**",
      "public/**",
    ],
  },
  ...coreWebVitals,
];
