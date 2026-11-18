import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "var(--bg)",
        panel: "var(--panel)",
        ink: "var(--ink)",
        muted: "var(--muted)",
        subtle: "var(--subtle)",
        line: "var(--line)",
        "line-strong": "var(--line-strong)",
        gutter: "var(--gutter)",
        accent: "var(--accent)",
        "accent-hover": "var(--accent-hover)",
        "accent-soft": "var(--accent-soft)",
        "accent-ink": "var(--accent-ink)",
        danger: "var(--danger)",
        "danger-soft": "var(--danger-soft)",
        success: "var(--success)",
        "success-soft": "var(--success-soft)",
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', '"Segoe UI"', 'Roboto', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', '"SF Mono"', 'Menlo', 'Consolas', 'monospace'],
      },
      boxShadow: {
        card: "0 1px 2px rgba(16,24,40,0.04), 0 1px 1px rgba(16,24,40,0.02)",
        raised: "0 1px 2px rgba(16,24,40,0.05), 0 8px 24px -8px rgba(16,24,40,0.08)",
        focus: "0 0 0 4px rgba(36,87,230,0.14)",
      },
      borderRadius: { xl: "0.875rem" },
      keyframes: {
        pop: {
          "0%": { opacity: "0", transform: "translateY(6px) scale(0.99)" },
          "100%": { opacity: "1", transform: "none" },
        },
      },
      animation: { pop: "pop 220ms cubic-bezier(0.2, 0.7, 0.2, 1) both" },
    },
  },
  plugins: [],
};
export default config;
