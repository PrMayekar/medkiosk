/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        // Core clinical palette — cool paper background, deep teal as the
        // single confident accent, a muted amber reserved only for
        // safety/red-flag signalling so it never competes with the accent.
        paper: {
          DEFAULT: "#F6F8F7",
          raised: "#FFFFFF",
        },
        ink: {
          DEFAULT: "#12201C",
          soft: "#4B5D57",
          faint: "#7C8B86",
        },
        teal: {
          50: "#EAF4F1",
          100: "#D3E8E2",
          200: "#A7D1C5",
          300: "#75B3A3",
          400: "#3E8C7A",
          500: "#0F6E63",
          600: "#0C5A51",
          700: "#0A473F",
          800: "#08352F",
          900: "#062621",
        },
        clay: {
          400: "#D68A4A",
          500: "#C06A2E",
          600: "#9C5322",
        },
        signal: {
          red: "#B3432B",
          redBg: "#FBEBE6",
        },
        line: "#E1E8E5",
      },
      fontFamily: {
        display: ["'Fraunces'", "ui-serif", "Georgia", "serif"],
        sans: ["'Manrope'", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      borderRadius: {
        xl2: "1.25rem",
      },
      boxShadow: {
        card: "0 1px 2px rgba(18, 32, 28, 0.04), 0 8px 24px -12px rgba(18, 32, 28, 0.12)",
      },
      keyframes: {
        pulseRing: {
          "0%": { transform: "scale(0.9)", opacity: "0.7" },
          "70%": { transform: "scale(1.6)", opacity: "0" },
          "100%": { transform: "scale(1.6)", opacity: "0" },
        },
        rise: {
          "0%": { transform: "translateY(6px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
      },
      animation: {
        pulseRing: "pulseRing 1.6s cubic-bezier(0.4,0,0.6,1) infinite",
        rise: "rise 0.35s ease-out",
      },
    },
  },
  plugins: [],
};
