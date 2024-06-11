/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './index.html',                   // Ensure to include the root index.html file
    './src/**/*.{js,jsx,ts,tsx,vue}', // Include all Vue, JS, and TS files in src
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
