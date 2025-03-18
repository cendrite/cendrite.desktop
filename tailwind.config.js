/** @type {import('tailwindcss').Config} */
// tailwind.config.js
export const content = [
  './index.html', // Vite entry HTML
  './src/**/*.{js,ts,jsx,tsx}', // Source files
];
export const theme = {
  extend: {
    colors: {
      beige:{
        500: '#F5F5DC',
      },
      darkGray: {
        50: "#757575",  // Lightest shade
        100: "#626262", // Very light gray
        200: "#515151", // Light gray1
        300: "#424242", // Medium-light gray
        400: "#373737", // Slightly lighter than base
        500: "#2E2E2E", // Base color
        600: "#272727", // Slightly darker than base
        700: "#202020", // Very dark gray
        800: "#1A1A1A", // Almost black
        900: "#141414", // Deepest black
      },
    },
    fontFamily: {
      sans: ['Inter', 'sans-serif'],
    }
  },
};
export const plugins = [];

