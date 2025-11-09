/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './index.html',
    './src/**/*.{vue,ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#2563eb'
      },
      backdropBlur: {
        xs: '2px'
      }
    },
  },
  plugins: [],
};