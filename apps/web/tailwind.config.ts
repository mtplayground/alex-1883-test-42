import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        sans: [
          "Inter",
          "ui-sans-serif",
          "system-ui",
          "sans-serif",
          "Apple Color Emoji",
          "Segoe UI Emoji"
        ],
        mono: ["JetBrains Mono", "ui-monospace", "SFMono-Regular", "monospace"]
      },
      colors: {
        ink: {
          950: "#111827",
          700: "#374151",
          500: "#6b7280"
        },
        rust: {
          600: "#b45309",
          500: "#d97706"
        },
        moss: {
          700: "#3f6212",
          500: "#65a30d"
        }
      }
    }
  },
  plugins: []
} satisfies Config;
