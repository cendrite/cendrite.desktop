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

      link: token('link'),

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

    },
    fontFamily: {
      sans: ['Inter', 'Noto Color Emoji', 'sans-serif'],
    }
  },
};
export const plugins = [];
