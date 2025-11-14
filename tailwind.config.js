/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // iOS System Colors
        primary: {
          DEFAULT: '#007AFF', // iOS Blue
          50: '#E5F2FF',
          100: '#CCE5FF',
          200: '#99CCFF',
          300: '#66B3FF',
          400: '#3399FF',
          500: '#007AFF',
          600: '#0062CC',
          700: '#004999',
          800: '#003166',
          900: '#001833',
        },
        // iOS Gray Scale
        gray: {
          50: '#F9F9F9',
          100: '#F2F2F7',   // iOS Light Gray
          150: '#E5E5EA',   // iOS Separator
          200: '#D1D1D6',
          300: '#C7C7CC',
          400: '#AEAEB2',
          500: '#8E8E93',   // iOS System Gray
          600: '#636366',
          700: '#48484A',
          800: '#3A3A3C',
          900: '#1C1C1E',
        },
        // iOS Semantic Colors
        success: '#34C759',  // iOS Green
        warning: '#FF9500',  // iOS Orange
        error: '#FF3B30',    // iOS Red
        // iOS Background
        background: {
          primary: '#FFFFFF',
          secondary: '#F2F2F7',
          tertiary: '#FFFFFF',
        }
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'SF Pro Display', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
      },
      borderRadius: {
        'ios': '10px',
        'ios-lg': '14px',
        'ios-xl': '20px',
      },
      boxShadow: {
        'ios': '0 0 0 0.5px rgba(0, 0, 0, 0.04)',
        'ios-sm': '0 1px 3px rgba(0, 0, 0, 0.04)',
        'ios-md': '0 4px 16px rgba(0, 0, 0, 0.08)',
        'ios-lg': '0 12px 24px rgba(0, 0, 0, 0.12)',
      },
    },
  },
  plugins: [],
}
