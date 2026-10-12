/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans Variable"', '"Plus Jakarta Sans"', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
      },
      colors: {
        ink: { DEFAULT: '#1f2340', soft: '#5b5f7a', mute: '#9a9db3' },
        canvas: '#f6f5fb',
        brand: {
          50: '#f3f0ff',
          100: '#e9e3ff',
          200: '#d4c9ff',
          400: '#9b84ff',
          500: '#7c5cfc',
          600: '#6a4cf0',
          700: '#5638d1',
        },
      },
      boxShadow: {
        card: '0 1px 2px rgba(31,35,64,0.04), 0 4px 16px rgba(31,35,64,0.05)',
        pop: '0 12px 40px rgba(31,35,64,0.18)',
      },
      borderRadius: { '4xl': '2rem' },
      keyframes: {
        'sheet-up': { from: { transform: 'translateY(100%)' }, to: { transform: 'translateY(0)' } },
        'fade-in': { from: { opacity: '0' }, to: { opacity: '1' } },
        pop: { '0%': { transform: 'scale(0.6)' }, '70%': { transform: 'scale(1.15)' }, '100%': { transform: 'scale(1)' } },
      },
      animation: {
        'sheet-up': 'sheet-up 0.28s cubic-bezier(.2,.8,.2,1)',
        'fade-in': 'fade-in 0.2s ease-out',
        pop: 'pop 0.3s ease-out',
      },
    },
  },
  plugins: [],
};
