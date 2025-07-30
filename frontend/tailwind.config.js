/** @type {import('tailwindcss').Config} */

const { fontFamily } = require('tailwindcss/defaultTheme')

module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      // IRIS Robotics Club Color Palette
      colors: {
        // Primary colors (Arwes theme)
        primary: {
          50: '#e6fffe',
          100: '#ccfffd',
          200: '#99fffb',
          300: '#66fff9',
          400: '#33fff7',
          500: '#00f8ff', // Main cyan
          600: '#00c6cc',
          700: '#009599',
          800: '#006366',
          900: '#003133',
        },
        secondary: {
          50: '#e6f2ff',
          100: '#cce6ff',
          200: '#99ccff',
          300: '#66b3ff',
          400: '#3399ff',
          500: '#0080ff', // Electric blue
          600: '#0066cc',
          700: '#004d99',
          800: '#003366',
          900: '#001a33',
        },
        success: {
          50: '#e6ffe9',
          100: '#ccffd3',
          200: '#99ffa7',
          300: '#66ff7b',
          400: '#33ff4f',
          500: '#00ff41', // Neon green
          600: '#00cc34',
          700: '#009927',
          800: '#00661a',
          900: '#00330d',
        },
        warning: {
          50: '#fff4e6',
          100: '#ffe9cc',
          200: '#ffd399',
          300: '#ffbd66',
          400: '#ffa733',
          500: '#ff8800', // Orange
          600: '#cc6d00',
          700: '#995200',
          800: '#663700',
          900: '#331b00',
        },
        error: {
          50: '#ffe6f0',
          100: '#ffcce0',
          200: '#ff99c2',
          300: '#ff66a3',
          400: '#ff3385',
          500: '#ff0040', // Red
          600: '#cc0033',
          700: '#990026',
          800: '#66001a',
          900: '#33000d',
        },
        // Neutral colors for dark theme
        neutral: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
          950: '#020617',
        },
        // Background colors
        background: {
          primary: '#000000',   // Pure black
          secondary: '#111111', // Dark gray
          tertiary: '#1a1a1a',  // Lighter dark
        },
      },

      // Typography
      fontFamily: {
        sans: ['Titillium Web', 'Inter', ...fontFamily.sans],
        mono: ['Roboto Mono', 'JetBrains Mono', ...fontFamily.mono],
        display: ['Orbitron', 'Titillium Web', ...fontFamily.sans],
      },

      // Spacing
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },

      // Animation
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'fade-out': 'fadeOut 0.5s ease-in-out',
        'slide-in': 'slideIn 0.3s ease-out',
        'slide-out': 'slideOut 0.3s ease-in',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
        'scan-line': 'scanLine 2s linear infinite',
        'iris-dilate': 'irisDilate 3s ease-in-out infinite',
        'float': 'float 6s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },

      // Keyframes
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeOut: {
          '0%': { opacity: '1' },
          '100%': { opacity: '0' },
        },
        slideIn: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(0)' },
        },
        slideOut: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(100%)' },
        },
        pulseGlow: {
          '0%, 100%': { 
            boxShadow: '0 0 20px rgba(0, 248, 255, 0.5)' 
          },
          '50%': { 
            boxShadow: '0 0 40px rgba(0, 248, 255, 0.8)' 
          },
        },
        scanLine: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
        irisDilate: {
          '0%, 100%': { transform: 'scale(0.8)' },
          '50%': { transform: 'scale(1.2)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        glow: {
          '0%': { 
            textShadow: '0 0 10px rgba(0, 248, 255, 0.8)' 
          },
          '100%': { 
            textShadow: '0 0 20px rgba(0, 248, 255, 1), 0 0 30px rgba(0, 248, 255, 0.8)' 
          },
        },
      },

      // Box shadows
      boxShadow: {
        'glow-sm': '0 0 10px rgba(0, 248, 255, 0.5)',
        'glow': '0 0 20px rgba(0, 248, 255, 0.6)',
        'glow-lg': '0 0 30px rgba(0, 248, 255, 0.7)',
        'glow-xl': '0 0 40px rgba(0, 248, 255, 0.8)',
        'inner-glow': 'inset 0 0 20px rgba(0, 248, 255, 0.3)',
      },

      // Border radius
      borderRadius: {
        'xl': '1rem',
        '2xl': '1.5rem',
        '3xl': '2rem',
      },

      // Backdrop blur
      backdropBlur: {
        xs: '2px',
      },

      // Grid
      gridTemplateColumns: {
        '16': 'repeat(16, minmax(0, 1fr))',
        '20': 'repeat(20, minmax(0, 1fr))',
      },

      // Z-index
      zIndex: {
        '60': '60',
        '70': '70',
        '80': '80',
        '90': '90',
        '100': '100',
      },

      // Aspect ratio
      aspectRatio: {
        '4/3': '4 / 3',
        '16/10': '16 / 10',
        '21/9': '21 / 9',
      },

      // Screens (responsive breakpoints)
      screens: {
        'xs': '475px',
        '3xl': '1600px',
        '4xl': '2000px',
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
    require('@tailwindcss/forms'),
    require('@tailwindcss/aspect-ratio'),
    
    // Custom plugin for IRIS-specific utilities
    function({ addUtilities, addComponents, theme }) {
      // Custom utilities
      addUtilities({
        '.text-glow': {
          textShadow: '0 0 10px rgba(0, 248, 255, 0.8)',
        },
        '.text-glow-strong': {
          textShadow: '0 0 20px rgba(0, 248, 255, 1), 0 0 30px rgba(0, 248, 255, 0.8)',
        },
        '.border-glow': {
          borderColor: 'rgba(0, 248, 255, 0.8)',
          boxShadow: '0 0 10px rgba(0, 248, 255, 0.5)',
        },
        '.bg-iris-gradient': {
          background: 'linear-gradient(135deg, #000000 0%, #001122 50%, #000000 100%)',
        },
        '.bg-scan-lines': {
          backgroundImage: `
            linear-gradient(90deg, transparent 49%, rgba(0, 248, 255, 0.1) 50%, transparent 51%),
            linear-gradient(0deg, transparent 49%, rgba(0, 248, 255, 0.1) 50%, transparent 51%)
          `,
          backgroundSize: '50px 50px',
        },
      })

      // Custom components
      addComponents({
        '.iris-card': {
          backgroundColor: 'rgba(17, 17, 17, 0.8)',
          border: '1px solid rgba(0, 248, 255, 0.3)',
          borderRadius: theme('borderRadius.lg'),
          backdropFilter: 'blur(10px)',
          boxShadow: '0 0 20px rgba(0, 248, 255, 0.1)',
        },
        '.iris-button': {
          backgroundColor: 'transparent',
          border: '2px solid #00f8ff',
          color: '#00f8ff',
          padding: theme('spacing.3') + ' ' + theme('spacing.6'),
          borderRadius: theme('borderRadius.md'),
          fontWeight: theme('fontWeight.semibold'),
          transition: 'all 0.3s ease',
          '&:hover': {
            backgroundColor: 'rgba(0, 248, 255, 0.1)',
            boxShadow: '0 0 20px rgba(0, 248, 255, 0.5)',
            transform: 'translateY(-2px)',
          },
        },
        '.iris-input': {
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          border: '1px solid rgba(0, 248, 255, 0.3)',
          borderRadius: theme('borderRadius.md'),
          color: '#ffffff',
          padding: theme('spacing.3'),
          '&:focus': {
            outline: 'none',
            borderColor: '#00f8ff',
            boxShadow: '0 0 10px rgba(0, 248, 255, 0.5)',
          },
        },
      })
    },
  ],
}
