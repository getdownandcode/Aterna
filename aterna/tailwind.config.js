/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        bg: {
          base: "#0D0D0F",
          card: "#141418",
          input: "#1C1C22",
          hover: "#252530",
        },
        border: {
          default: "#2E2E3C",
          emphasis: "#3D3D50",
          accent: "#7B6EF6",
        },
        accent: {
          DEFAULT: "#7B6EF6",
          light: "#A99CF8",
          surface: "#2D2850",
          bg: "#1E1B3A",
        },
        text: {
          primary: "#F5F5F7",
          secondary: "#8E8E9A",
          tertiary: "#5A5A6A",
        },
        success: {
          DEFAULT: "#34C759",
          bg: "#1A4A2A",
        },
        warning: {
          DEFAULT: "#FFB340",
          bg: "#3D2E10",
        },
        danger: {
          DEFAULT: "#FF6B35",
          bg: "#3D1A10",
        },
      },
    },
  },
  plugins: [],
};
