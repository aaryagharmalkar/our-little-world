/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cream: {
          50: '#FCFAF7',
          100: '#FAF7F2',
          200: '#F4ECE0',
          300: '#EAE0D0',
        },
        sand: {
          50: '#F8F6F0',
          100: '#F1ECE1',
          200: '#E6DCCF',
          300: '#D7C7B4',
        },
        blush: {
          50: '#FCF8F7',
          100: '#F8ECE9',
          200: '#F2D7D2',
          300: '#EABCB5',
          400: '#DD9B93',
          500: '#CE7973',
          600: '#B55A55',
          700: '#94433F',
        },
        lavender: {
          50: '#FAF8FC',
          100: '#F2EDF8',
          200: '#E4DBEF',
          300: '#CCBEE1',
          400: '#AB97CC',
          500: '#8E73B5',
        },
        warm: {
          50: '#FBFBFA',
          100: '#F6F5F2',
          200: '#EBE9E3',
          300: '#D9D5CB',
          400: '#A6A094',
          500: '#787267',
          600: '#5A544A',
          700: '#423D35',
          800: '#2F2B25',
          900: '#1D1A16',
        }
      },
      fontFamily: {
        serif: ['"Playfair Display"', 'Georgia', 'serif'],
        sans: ['"Plus Jakarta Sans"', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'sans-serif'],
        handwriting: ['"Caveat"', 'cursive'],
      },
      boxShadow: {
        'soft': '0 4px 24px -2px rgba(181, 90, 85, 0.08), 0 2px 8px -2px rgba(0, 0, 0, 0.04)',
        'float': '0 12px 32px -4px rgba(142, 115, 181, 0.12), 0 4px 12px -2px rgba(0, 0, 0, 0.05)',
        'romantic': '0 8px 30px rgba(206, 121, 115, 0.15)',
        'inner-soft': 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.04)',
      },
      borderRadius: {
        '3xl': '1.75rem',
        '4xl': '2.25rem',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 4s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-6px)' },
        }
      }
    },
  },
  plugins: [],
}
