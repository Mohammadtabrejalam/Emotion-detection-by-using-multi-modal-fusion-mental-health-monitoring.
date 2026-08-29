/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0f4ff',
          100: '#d9e2ff',
          200: '#bcceff',
          300: '#93afff',
          400: '#6387ff',
          500: '#3b5eff',
          600: '#253eff',
          700: '#1d2eff',
          800: '#1926cc',
          900: '#1a27a3',
          950: '#101761',
        },
        slate: {
          950: '#070a13',
          900: '#0e1322',
          800: '#171e31',
          700: '#252e46',
        }
      },
      fontFamily: {
        sans: ['Outfit', 'Inter', 'sans-serif'],
      },
      backdropBlur: {
        xs: '2px',
      }
    },
  },
  plugins: [],
}
