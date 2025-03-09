/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f5f3ff',
          100: '#ede9fe',
          200: '#dee8ff',
          300: '#c6d4ff',
          400: '#a6bcff',
          500: '#8899ff',
          600: '#7c3aed',
          700: '#4c5cc2',
          800: '#3f4a9f',
          900: '#4c1d95',
        },
      },
    },
  },
  plugins: [],
} 