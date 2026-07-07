import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        felt: {
          900: "#082a1e",
          800: "#0c3d2b",
          700: "#145a3f",
          600: "#1c7350",
        },
        accent: {
          gold: "#E8C26A",
          red: "#E2493D",
          blue: "#4FA3E3",
          green: "#3FBF7F",
        },
      },
      fontFamily: {
        display: ["'Bebas Neue'", "'Oswald'", "sans-serif"],
        body: ["'Inter'", "sans-serif"],
        mono: ["'JetBrains Mono'", "monospace"],
      },
      boxShadow: {
        glass: "0 8px 32px 0 rgba(0, 0, 0, 0.37)",
        glow: "0 0 24px rgba(232, 194, 106, 0.5)",
      },
      backdropBlur: {
        glass: "14px",
      },
      keyframes: {
        "card-deal": {
          "0%": { transform: "translate(-40vw, -40vh) rotate(-15deg) scale(0.4)", opacity: "0" },
          "100%": { transform: "translate(0,0) rotate(0deg) scale(1)", opacity: "1" },
        },
        "pulse-glow": {
          "0%, 100%": { boxShadow: "0 0 0px rgba(232, 194, 106, 0.0)" },
          "50%": { boxShadow: "0 0 18px rgba(232, 194, 106, 0.65)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
      animation: {
        "card-deal": "card-deal 0.5s cubic-bezier(0.22, 1, 0.36, 1) forwards",
        "pulse-glow": "pulse-glow 1.6s ease-in-out infinite",
        shimmer: "shimmer 2.5s linear infinite",
      },
    },
  },
  plugins: [],
} satisfies Config;
