/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        brand:    { DEFAULT: '#1D4ED8', dark: '#1E40AF', light: '#DBEAFE' },
        finBlue:  '#1D4ED8',
        finTeal:  '#0D9488',
        finGreen: '#16A34A',
        finGray:  '#F8FAFC',
        finMuted: '#64748B',
      },
      fontFamily: { sans: ['Inter', 'sans-serif'] },
      boxShadow: {
        card: '0 1px 3px 0 rgb(0 0 0 / 0.07), 0 1px 2px -1px rgb(0 0 0 / 0.05)',
        elevated: '0 4px 6px -1px rgb(0 0 0 / 0.08), 0 2px 4px -2px rgb(0 0 0 / 0.06)',
      },
    },
  },
  plugins: [],
}
