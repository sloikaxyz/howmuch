import { type Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {},
  },
  plugins: [
    // Add Tailwind.css plugins here
    require("tailwindcss-debug-screens"),
  ],
} satisfies Config;
