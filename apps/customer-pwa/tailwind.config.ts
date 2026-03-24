import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        /** Design system — ล็อกใน TECH_STACK.md */
        primary: '#0EA5E9',
        secondary: '#22C55E',
        dark: '#0F172A',
        ocean: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#90e0ef',
          400: '#48cae4',
          500: '#00b4d8',
          600: '#0096c7',
          700: '#0077b6',
          800: '#023e8a',
          900: '#03045e',
        },
      },
      fontFamily: {
        sans: ['Inter', 'Noto Sans Thai', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'card': '0 2px 16px rgba(0, 119, 182, 0.08)',
        'card-hover': '0 8px 30px rgba(0, 119, 182, 0.15)',
        'bottom-bar': '0 -4px 20px rgba(0, 0, 0, 0.08)',
      },
      animation: {
        'wave': 'wave 8s ease-in-out infinite',
        'wave-slow': 'wave 12s ease-in-out infinite',
        'float': 'float 6s ease-in-out infinite',
        'shimmer': 'shimmer 2s linear infinite',
        'slide-up': 'slideUp 0.5s ease-out',
        'fade-in': 'fadeIn 0.5s ease-out',
      },
      keyframes: {
        wave: {
          '0%, 100%': { transform: 'translateX(0) translateY(0)' },
          '25%': { transform: 'translateX(-5%) translateY(-3%)' },
          '50%': { transform: 'translateX(-10%) translateY(0)' },
          '75%': { transform: 'translateX(-5%) translateY(3%)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
