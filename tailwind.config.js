/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: {
          50: '#e8f0fe',
          100: '#c9d9fc',
          200: '#a3bef9',
          300: '#7ba2f5',
          400: '#5a87f1',
          500: '#3b6be8',
          600: '#1e3a6e',
          700: '#172e58',
          800: '#111f3d',
          900: '#0f172a',
          950: '#080e1c',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
