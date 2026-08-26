import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

const eslintConfig = [
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
    ],
  },
  ...nextCoreWebVitals,
  ...nextTypescript,
  {
    rules: {
      // Pre-existing idioms across the admin pages (data fetching on mount,
      // window.location redirects on 401). Both are scheduled for cleanup when
      // the admin pages move to server components. Kept as warnings so real
      // regressions still surface; do not introduce new occurrences.
      "react-hooks/set-state-in-effect": "warn",
      "@next/next/no-location-assign-relative-destination": "warn",
    },
  },
];

export default eslintConfig;
