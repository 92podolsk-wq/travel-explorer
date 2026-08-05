import nextConfig from "eslint-config-next";

const eslintConfig = [
  ...nextConfig,
  {
    ignores: [".next/**", "node_modules/**", "next-env.d.ts"]
  },
  {
    rules: {
      // Most hits are legitimate external-system syncs (navigator.onLine, localStorage,
      // window.Capacitor) or resetting local UI state when a selection changes — not the
      // derived-state anti-pattern this rule targets. Kept as a warning to flag new cases.
      "react-hooks/set-state-in-effect": "warn"
    }
  }
];

export default eslintConfig;
