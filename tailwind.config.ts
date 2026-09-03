import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#09090b",
        card: "#121215",
        "card-hover": "#18181c",
        border: "#27272a",
        muted: "#71717a",
        combat: {
          red: "#ef4444",
          "red-dark": "#b91c1c",
          "red-glow": "rgba(239, 68, 68, 0.15)",
          gold: "#f59e0b",
          green: "#10b981",
          blue: "#06b6d4",
        },
      },
      boxShadow: {
        "glow-red": "0 0 20px -5px rgba(239, 68, 68, 0.3)",
        "glow-subtle": "0 4px 20px 0 rgba(0, 0, 0, 0.4)",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "-apple-system", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
    },
  },
  plugins: [],
};

export default config;
