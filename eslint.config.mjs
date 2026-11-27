import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

const config = [
  ...nextCoreWebVitals,
  ...nextTypescript,
  {
    ignores: [
      ".next/**",
      "node_modules/**",
      "America360_Dev_Kit/**",
      "references/**",
      "data/**",
      "playwright-report/**",
      "test-results/**",
      "next-env.d.ts",
    ],
  },
];
export default config;
