/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./*.{js,jsx,ts,tsx}",
    "./index.html"
  ],
  theme: {
    extend: {
      colors: {
        'void-black': '#050505',
        'matrix-green': '#00ff41',
        'alert-red': '#ef4444',
        'hyper-violet': '#9333ea',
        'amber-warning': '#f59e0b',
      },
      fontFamily: {
        mono: ['"JetBrains Mono"', 'monospace'],
      },
    },
  },
  plugins: [],
}