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
        matte: {
          bg: '#0A0C11',
          surface: '#11141C',
          elevated: '#161A24',
          subtle: '#1C212E',
          input: '#0C0E14',
          border: '#1E2332',
          'border-focus': '#2E364A',
          'border-hover': '#293042',
          accent: '#5E6AD2',
          'accent-hover': '#4E5AC0',
          'accent-subtle': 'rgba(94, 106, 210, 0.12)',
        },
        brand: {
          50: '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#5e6ad2',
          600: '#4e5ac0',
          700: '#4338ca',
          800: '#3730a3',
          900: '#1e1b4b',
          950: '#0a0c11',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        'matte-sm': '0 1px 2px 0 rgba(0, 0, 0, 0.4)',
        'matte': '0 4px 16px -2px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.04)',
        'matte-lg': '0 12px 32px -4px rgba(0, 0, 0, 0.7), 0 0 0 1px rgba(255, 255, 255, 0.06)',
      }
    },
  },
  plugins: [],
}
