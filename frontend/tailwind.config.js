/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: { DEFAULT: '#1e40af', light: '#3b82f6', dark: '#1e3a8a' },
        success: { DEFAULT: '#16a34a', dark: '#15803d' },
        warning: { DEFAULT: '#d97706', dark: '#b45309' },
        danger:  { DEFAULT: '#dc2626', dark: '#b91c1c' },
        info:    { DEFAULT: '#0891b2', dark: '#0e7490' },
      },
      fontFamily: {
        sans: ['Inter', 'Segoe UI', 'system-ui', '-apple-system', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
