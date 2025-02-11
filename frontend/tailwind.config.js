/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{html,js,jsx,ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        geist: ["Geist", "serif"],
      },
    },
  },
  plugins: [require("@tailwindcss/line-clamp")],
}

