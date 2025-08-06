/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        'dark-bg': '#0d1117',
        'dark-text': '#e6edf3',
        'neon-cyan': '#00ffd1',
        'neon-pink': '#ff4d97',
        'gray-800': '#21262d',
        'gray-700': '#30363d',
        'gray-600': '#484f58'
      },
      fontFamily: {
        'mono': ['JetBrains Mono', 'Consolas', 'Monaco', 'monospace']
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'spin-slow': 'spin 20s linear infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' }
        },
        glow: {
          '0%': { textShadow: '0 0 5px #00ffd1, 0 0 10px #00ffd1, 0 0 15px #00ffd1' },
          '100%': { textShadow: '0 0 10px #00ffd1, 0 0 20px #00ffd1, 0 0 30px #00ffd1' }
        }
      }
    },
  },
  plugins: [],
}
