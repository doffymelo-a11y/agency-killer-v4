/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Agent Colors
        sora: {
          light: '#DBEAFE',
          primary: '#3B82F6',
          dark: '#1D4ED8',
        },
        luna: {
          light: '#EDE9FE',
          primary: '#8B5CF6',
          dark: '#6D28D9',
        },
        marcus: {
          light: '#D1FAE5',
          primary: '#10B981',
          dark: '#047857',
        },
        milo: {
          light: '#FCE7F3',
          primary: '#EC4899',
          dark: '#BE185D',
        },
        orchestrator: {
          light: '#FEF3C7',
          primary: '#F59E0B',
          dark: '#B45309',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
