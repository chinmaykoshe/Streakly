/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: "#FFB000",
        background: "#121212",
        card: "#1C1C1E",
        surface: "#2C2C2E",
        border: "rgba(255,255,255,0.08)",
        text: {
          DEFAULT: "#FFFFFF",
          secondary: "#9E9E9E",
          muted: "#555555",
        },
        accent: {
          green: "#4CAF50",
          red: "#FF5252",
          blue: "#03A9F4",
          purple: "#6C63FF",
        },
      },
      borderRadius: {
        "2xl": "16px",
        "3xl": "24px",
      },
    },
  },
  plugins: [],
};
