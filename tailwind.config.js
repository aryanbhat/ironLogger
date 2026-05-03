/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#1E3A5F',
        accent: '#FF6B35',
        bg: '#0D1B2A',
        surface: '#162232',
        surface2: '#1F3347',
        textPrimary: '#F0F4F8',
        muted: '#8BA3B8',
        success: '#2D6A4F',
        danger: '#C1121F',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      screens: {
        xs: '360px',
      },
      animation: {
        'pulse-slow': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'spin-slow': 'spin 3s linear infinite',
      },
    },
  },
  plugins: [],
}
