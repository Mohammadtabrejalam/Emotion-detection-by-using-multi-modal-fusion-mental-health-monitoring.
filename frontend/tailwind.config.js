/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0f5ff',
          100: '#e0ecff',
          200: '#c7dcfe',
          300: '#a1c4fd',
          400: '#689efb',
          500: '#3b78f6',
          600: '#1d54e4',
          700: '#153ec4',
          800: '#16359f',
          900: '#17307e',
          950: '#0e1d4b',
        },
        academic: {
          navy: '#0f1f38',
          slate: '#1a273a',
          blue: '#1d4ed8',
          gold: '#c59b27',
          surface: '#f8fafc',
          border: '#e2e8f0',
        },
        slate: {
          950: '#090d16',
          900: '#0f172a',
          850: '#141e33',
          800: '#1e293b',
          700: '#334155',
          600: '#475569',
          500: '#64748b',
          400: '#94a3b8',
          300: '#cbd5e1',
          200: '#e2e8f0',
          100: '#f1f5f9',
          50: '#f8fafc',
        }
      },
      fontFamily: {
        sans: ['Inter', 'Outfit', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        serif: ['Merriweather', 'Georgia', 'serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Consolas', 'monospace'],
      },
      boxShadow: {
        'academic-sm': '0 1px 3px 0 rgba(15, 23, 42, 0.05), 0 1px 2px -1px rgba(15, 23, 42, 0.05)',
        'academic-md': '0 4px 6px -1px rgba(15, 23, 42, 0.07), 0 2px 4px -2px rgba(15, 23, 42, 0.05)',
        'academic-lg': '0 10px 15px -3px rgba(15, 23, 42, 0.08), 0 4px 6px -4px rgba(15, 23, 42, 0.04)',
        'academic-glow': '0 0 20px -5px rgba(29, 78, 216, 0.25)',
      }
    },
  },
  plugins: [],
}
