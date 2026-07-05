/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        base: {
          950: '#05070d',
          900: '#0a0e17',
          800: '#0f1420',
          700: '#161c2c',
          600: '#1e2740',
        },
        neon: {
          DEFAULT: '#3B82F6',
          light: '#60A5FA',
          dark: '#1D4ED8',
          glow: '#3B82F680',
        },
        accent: {
          violet: '#8B5CF6',
          cyan: '#22D3EE',
          gold: '#FBBF24',
        },
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'sans-serif'],
        body: ['"Inter"', 'sans-serif'],
      },
      boxShadow: {
        neon: '0 0 20px rgba(59,130,246,0.45)',
        'neon-lg': '0 0 40px rgba(59,130,246,0.35)',
        glass: '0 8px 32px rgba(0,0,0,0.45)',
        premium: '0 8px 40px -8px rgba(59,130,246,0.35), 0 2px 8px rgba(0,0,0,0.4)',
        'premium-lg': '0 20px 60px -12px rgba(59,130,246,0.4), 0 4px 16px rgba(0,0,0,0.5)',
      },
      backgroundImage: {
        'grid-glow':
          'radial-gradient(circle at 20% 20%, rgba(59,130,246,0.18), transparent 40%), radial-gradient(circle at 80% 0%, rgba(59,130,246,0.12), transparent 35%)',
        'aurora':
          'radial-gradient(circle at 15% 15%, rgba(139,92,246,0.35), transparent 45%), radial-gradient(circle at 85% 10%, rgba(34,211,238,0.28), transparent 45%), radial-gradient(circle at 50% 90%, rgba(59,130,246,0.3), transparent 50%)',
        'shine': 'linear-gradient(115deg, transparent 20%, rgba(255,255,255,0.25) 45%, rgba(255,255,255,0.25) 55%, transparent 80%)',
      },
      transitionTimingFunction: {
        premium: 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
      animation: {
        'pulse-slow': 'pulse 3.5s cubic-bezier(0.4,0,0.6,1) infinite',
        float: 'float 6s ease-in-out infinite',
        'float-slow': 'float 9s ease-in-out infinite',
        shimmer: 'shimmer 2s linear infinite',
        'gradient-x': 'gradient-x 6s ease infinite',
        blob: 'blob 14s ease-in-out infinite',
        'glow-pulse': 'glow-pulse 2.4s ease-in-out infinite',
        shine: 'shine 2.6s ease-in-out infinite',
        'fade-up': 'fade-up 0.6s cubic-bezier(0.16,1,0.3,1) both',
      },
      keyframes: {
        float: {
          '0%,100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-700px 0' },
          '100%': { backgroundPosition: '700px 0' },
        },
        'gradient-x': {
          '0%,100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        blob: {
          '0%,100%': { transform: 'translate(0,0) scale(1)' },
          '33%': { transform: 'translate(30px,-40px) scale(1.1)' },
          '66%': { transform: 'translate(-20px,20px) scale(0.95)' },
        },
        'glow-pulse': {
          '0%,100%': { opacity: 0.5, transform: 'scale(1)' },
          '50%': { opacity: 1, transform: 'scale(1.06)' },
        },
        shine: {
          '0%': { transform: 'translateX(-120%)' },
          '100%': { transform: 'translateX(120%)' },
        },
        'fade-up': {
          '0%': { opacity: 0, transform: 'translateY(16px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}
