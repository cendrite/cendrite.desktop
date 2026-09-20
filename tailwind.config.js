/** @type {import('tailwindcss').Config} */
// tailwind.config.js
const token = (name) => `rgb(var(--color-${name}) / <alpha-value>)`;

export const content = [
  './index.html', // Vite entry HTML
  './src/**/*.{js,ts,jsx,tsx}', // Source files
];
export const theme = {
  extend: {
    colors: {
      canvas: token('canvas'),
      'canvas-hover': token('canvas-hover'),
      surface: token('surface'),
      'surface-hover': token('surface-hover'),
      overlay: token('overlay'),
      'overlay-hover': token('overlay-hover'),
      field: token('field'),
      scrim: token('scrim'),

      line: token('line'),
      'line-strong': token('line-strong'),

      fg: token('fg'),
      'fg-muted': token('fg-muted'),
      'fg-subtle': token('fg-subtle'),
      'fg-faint': token('fg-faint'),
      'fg-inverted': token('fg-inverted'),
      'fg-on-accent': token('fg-on-accent'),

      inverted: token('inverted'),
      'inverted-hover': token('inverted-hover'),
      media: token('media'),
      'bubble-in': token('bubble-in'),
      'bubble-in-fg': token('bubble-in-fg'),

      accent: token('accent'),
      'accent-hover': token('accent-hover'),
      'accent-soft': token('accent-soft'),
      'accent-soft-fg': token('accent-soft-fg'),

      danger: token('danger'),
      'danger-hover': token('danger-hover'),
      'danger-fg': token('danger-fg'),
      'danger-fg-hover': token('danger-fg-hover'),

      success: token('success'),
      warning: token('warning'),

      // Retained until the sweep is done; removing it early makes stale classes render transparent.
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
