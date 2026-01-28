import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        blossom: {
          50: "#fff5f7",
          100: "#ffe8ec",
          200: "#ffd4dd",
          300: "#ffb3c1",
          400: "#ff8099",
          500: "#f94d73",
          600: "#e91e5a",
          700: "#c40d46",
          800: "#a40f3d",
          900: "#8b1237",
        },
        "light-pink": "#ffe8ec",
        "soft-pink": "#ffd4dd",
        "theme-pink": "#ffb3c1",
      },
      backgroundImage: {
        "gradient-blossom": "linear-gradient(135deg, #ffe8ec 0%, #ffd4dd 50%, #ffb3c1 100%)",
        "gradient-soft": "linear-gradient(180deg, #fff5f7 0%, #ffe8ec 100%)",
      },
      boxShadow: {
        bubble: "0 2px 12px rgba(255, 182, 193, 0.25)",
        toast: "0 8px 32px rgba(0,0,0,0.12)",
      },
      keyframes: {
        "fade-in": { "0%": { opacity: "0", transform: "scale(0.96)" }, "100%": { opacity: "1", transform: "scale(1)" } },
      },
      animation: {
        "fade-in": "fade-in 0.25s ease-out forwards",
      },
    },
  },
  plugins: [],
};

export default config;
