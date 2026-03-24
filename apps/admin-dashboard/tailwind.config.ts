import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        sidebar: {
          DEFAULT: '#1e293b',
          hover: '#334155',
          active: '#0f172a',
          border: '#334155',
        },
        ocean: {
          50: '#e6f3fa',
          100: '#b3ddf0',
          200: '#80c7e6',
          300: '#4db1dc',
          400: '#269bd2',
          500: '#0077b6',
          600: '#006094',
          700: '#004a72',
          800: '#003350',
          900: '#001d2e',
        },
        admin: {
          bg: '#f8fafc',
          card: '#ffffff',
          border: '#e2e8f0',
          text: '#1e293b',
          muted: '#64748b',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
