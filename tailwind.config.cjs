/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ibkr: {
          orange: '#F79239',
          blue: '#1E61CB',
          gray: '#4A4A4A',
          lightgray: '#F1F1F1',
        }
      },
    },
  },
  plugins: [],
}