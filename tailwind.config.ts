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
        background: "var(--background)",
        foreground: "var(--foreground)",
        siad: {
          navy: {
            50: "#eef2fb",
            100: "#dce5f7",
            200: "#bacbef",
            300: "#91aadf",
            400: "#6483cd",
            500: "#3d5fb4",
            600: "#24438f",
            700: "#173373",
            800: "#0b245c",
            900: "#061746",
          },
          violet: {
            50: "#f5f0ff",
            100: "#ebe2ff",
            200: "#d6c3ff",
            300: "#b698ff",
            400: "#9165ff",
            500: "#713cf0",
            600: "#5b21d6",
            700: "#4b1bb5",
            800: "#39168b",
            900: "#28105f",
          },
          gold: {
            100: "#fff3c4",
            400: "#ffbf24",
            500: "#ffb000",
            700: "#a65b00",
          },
        },
      },
    },
  },
  plugins: [],
};
export default config;
