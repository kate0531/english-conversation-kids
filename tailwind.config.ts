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
        "pop-in": { "0%": { opacity: "0", transform: "scale(0.8)" }, "70%": { transform: "scale(1.05)" }, "100%": { opacity: "1", transform: "scale(1)" } },
        "hint-float": {
          "0%": { opacity: "1", transform: "translateY(0) scale(1)" },
          "60%": { opacity: "1", transform: "translateY(-20px) scale(1.02)" },
          "100%": { opacity: "0", transform: "translateY(-60px) scale(0.98)" },
        },
        "hint-blink": {
          "0%, 50%, 100%": { opacity: "1" },
          "25%, 75%": { opacity: "0.5" },
        },
        "hint-burst": {
          "0%, 35%": { opacity: "1", transform: "scale(1)" },
          "50%": { opacity: "1", transform: "scale(1.2)" },
          "70%": { opacity: "0.7", transform: "scale(1.35)" },
          "100%": { opacity: "0", transform: "scale(1.5)" },
        },
        "hint-pop": {
          "0%": { opacity: "1", transform: "scale(1)" },
          "50%": { opacity: "1", transform: "scale(1.3)" },
          "100%": { opacity: "0", transform: "scale(1.5)" },
        },
        "hint-pop-bang": {
          "0%": { opacity: "1", transform: "scale(1)" },
          "30%": { opacity: "1", transform: "scale(1.5)" },
          "60%": { opacity: "0.9", transform: "scale(2)" },
          "100%": { opacity: "0", transform: "scale(2.2)" },
        },
        "hint-shrink-float": {
          "0%": { opacity: "1", transform: "translateY(0) scale(1)" },
          "50%": { opacity: "1", transform: "translateY(-30px) scale(0.7)" },
          "100%": { opacity: "0", transform: "translateY(-80px) scale(0.3)" },
        },
        "hint-fade-up-out": {
          "0%": { opacity: "1", transform: "translateY(0)" },
          "100%": { opacity: "0", transform: "translateY(-48px)" },
        },
        "fall-down": {
          "0%": { opacity: "0", transform: "translateY(-40px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "countdown-pop": {
          "0%": { opacity: "0", transform: "scale(0.5)" },
          "60%": { opacity: "1", transform: "scale(1.1)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        "curtain-lift": {
          "0%": { opacity: "1", transform: "translateY(0)" },
          "100%": { opacity: "0", transform: "translateY(-100%)" },
        },
        "curtain-fade-out": {
          "0%": { opacity: "1" },
          "100%": { opacity: "0" },
        },
        "go-fade-out": {
          "0%": { opacity: "1" },
          "40%": { opacity: "1" },
          "100%": { opacity: "0" },
        },
        "countdown-bounce": {
          "0%": { opacity: "0", transform: "scale(0.4) translateY(10px)" },
          "55%": { opacity: "1", transform: "scale(1.12) translateY(-4px)" },
          "75%": { transform: "scale(0.98) translateY(2px)" },
          "100%": { opacity: "1", transform: "scale(1) translateY(0)" },
        },
        "go-burst": {
          "0%": { opacity: "0", transform: "scale(0.3)" },
          "25%": { opacity: "1", transform: "scale(1.35)" },
          "45%": { transform: "scale(1.15)" },
          "65%": { transform: "scale(1.25)" },
          "85%": { transform: "scale(1.08)" },
          "100%": { opacity: "1", transform: "scale(1.1)" },
        },
        "go-glow": {
          "0%": { opacity: "0.4", transform: "scale(0.8)" },
          "50%": { opacity: "0.9", transform: "scale(1.5)" },
          "100%": { opacity: "0", transform: "scale(2.2)" },
        },
        "sparkle": {
          "0%": { opacity: "0", transform: "scale(0)" },
          "40%": { opacity: "1", transform: "scale(1)" },
          "100%": { opacity: "0", transform: "scale(1.8)" },
        },
        "score-blink": {
          "0%, 100%": { opacity: "1", boxShadow: "0 0 0 3px rgba(245, 158, 11, 0.5)" },
          "50%": { opacity: "0.6", boxShadow: "0 0 0 8px rgba(245, 158, 11, 0.3)" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.25s ease-out forwards",
        "pop-in": "pop-in 0.4s ease-out forwards",
        "hint-float": "hint-float 4s ease-out forwards",
        "hint-blink": "hint-blink 0.8s ease-in-out 4",
        "hint-burst": "hint-burst 4s ease-out forwards",
        "hint-pop": "hint-pop 0.35s ease-out forwards",
        "hint-pop-bang": "hint-pop-bang 0.4s ease-out forwards",
        "hint-shrink-float": "hint-shrink-float 0.45s ease-out forwards",
        "hint-fade-up-out": "hint-fade-up-out 0.5s ease-out forwards",
        "fall-down": "fall-down 0.5s ease-out forwards",
        "countdown-pop": "countdown-pop 0.4s ease-out forwards",
        "curtain-lift": "curtain-lift 0.5s ease-out forwards",
        "curtain-fade-out": "curtain-fade-out 0.6s ease-out forwards",
        "go-fade-out": "go-fade-out 0.5s ease-out forwards",
        "countdown-bounce": "countdown-bounce 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards",
        "go-burst": "go-burst 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards",
        "go-glow": "go-glow 0.7s ease-out forwards",
        "sparkle": "sparkle 0.6s ease-out forwards",
        "score-blink": "score-blink 1.2s ease-in-out infinite",
      },
      fontFamily: {
        lovely: ["var(--font-nunito)", "Nunito", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
