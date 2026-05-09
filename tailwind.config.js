/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        rose: {
          dusty: '#E8B4B8',
          light: '#F2D5D8',
          dark: '#C9868B',
        },
        sage: {
          DEFAULT: '#A8B5A0',
          light: '#C5CFC2',
          dark: '#7A9070',
        },
        cream: {
          DEFAULT: '#FAF6F1',
          dark: '#F0E8DF',
        },
        plum: {
          DEFAULT: '#4A3B47',
          light: '#6B5568',
          dark: '#2E2430',
        },
        gold: {
          DEFAULT: '#D4A574',
          light: '#E8C9A0',
          dark: '#B8885A',
        },
      },
      fontFamily: {
        sans: ['Inter_400Regular', 'System'],
        medium: ['Inter_500Medium', 'System'],
        semibold: ['Inter_600SemiBold', 'System'],
        bold: ['Inter_700Bold', 'System'],
      },
      borderRadius: {
        xl: '16px',
        '2xl': '24px',
        '3xl': '32px',
      },
    },
  },
  plugins: [],
};
