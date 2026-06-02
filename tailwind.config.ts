import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}"
  ],
  theme: {
    container: {
      center: true,
      padding: "1rem",
      screens: {
        "2xl": "1180px"
      }
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "#A61D2D",
          foreground: "#fff8f0"
        },
        gold: {
          DEFAULT: "#D4AF37",
          deep: "#9D7520",
          pale: "#F3DD91"
        },
        cream: "#FFF8F0",
        maroon: "#6F101E",
        charcoal: "#24171A"
      },
      fontFamily: {
        heading: ["var(--font-playfair)", "serif"],
        sans: ["var(--font-poppins)", "sans-serif"]
      },
      boxShadow: {
        luxury: "0 24px 70px rgba(111, 16, 30, 0.14)",
        gold: "0 12px 34px rgba(212, 175, 55, 0.22)"
      },
      backgroundImage: {
        motif:
          "radial-gradient(circle at 1px 1px, rgba(166,29,45,.14) 1px, transparent 0)"
      }
    }
  },
  plugins: [require("@tailwindcss/typography")]
};

export default config;
