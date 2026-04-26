import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        navy: "#1E3A5F",
        charcoal: "#4A4A4A",
        gold: "#C07810",
        offwhite: "#F4F7FB"
      },
      fontFamily: {
        heading: ["Poppins", "sans-serif"],
        body: ["Open Sans", "sans-serif"]
      }
    }
  },
  plugins: []
};

export default config;
