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
      }
    }
  },
};
export const plugins = [];

