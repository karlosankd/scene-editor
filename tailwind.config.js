/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // UE5 Dark Theme Colors
        ue: {
          bg: {
            dark: '#1a1a1a',
            DEFAULT: '#242424',
            light: '#2a2a2a',
            lighter: '#323232',
            hover: '#3a3a3a',
          },
          border: {
            DEFAULT: '#3a3a3a',
            light: '#4a4a4a',
          },
          text: {
            primary: '#e0e0e0',
            secondary: '#a0a0a0',
            muted: '#707070',
          },
          accent: {
            blue: '#0d6efd',
            green: '#198754',
            yellow: '#ffc107',
            red: '#dc3545',
            orange: '#fd7e14',
            purple: '#6f42c1',
          },
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Consolas', 'monospace'],
      },
    },
  },
  plugins: [],
}
