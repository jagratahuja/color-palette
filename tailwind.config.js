/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        background: '#0a0f1c',
        foreground: '#f0f4ff',
        card: '#0d1424',
        border: '#1e3a5f',
        primary: '#3b82f6',
        secondary: '#a855f7',
        accent: '#00d4ff',
        teal: '#14b8a6',
        muted: '#64748b',
        'muted-foreground': '#94a3b8',
      },
      fontFamily: {
        sans: ['Sora', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      boxShadow: {
        neon: '0 0 0 1px rgba(30,58,95,0.5), 0 14px 36px rgba(59,130,246,0.22)',
      },
    },
  },
  plugins: [],
};
