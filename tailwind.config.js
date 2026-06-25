/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Nunito"', 'system-ui', 'sans-serif'],
      },
      colors: {
        peach:    { 50: '#fff7ed', 100: '#ffedd5', 200: '#fed7aa', 300: '#fdba74', 400: '#fb923c' },
        lavender: { 50: '#faf5ff', 100: '#f3e8ff', 200: '#e9d5ff', 300: '#d8b4fe', 400: '#c084fc', 500: '#a855f7' },
      },
      keyframes: {
        'fade-in':  { from: { opacity: '0', transform: 'translateY(6px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        'slide-up': { from: { opacity: '0', transform: 'translateY(20px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        'bounce-in':{ '0%': { transform: 'scale(.88)', opacity: '0' }, '60%': { transform: 'scale(1.04)' }, '100%': { transform: 'scale(1)', opacity: '1' } },
        'toast-in': { from: { opacity: '0', transform: 'translateY(12px) scale(.95)' }, to: { opacity: '1', transform: 'translateY(0) scale(1)' } },
      },
      animation: {
        'fade-in':  'fade-in .22s ease-out',
        'slide-up': 'slide-up .28s ease-out',
        'bounce-in':'bounce-in .32s ease-out',
        'toast-in': 'toast-in .22s ease-out',
      },
    },
  },
  plugins: [],
}

