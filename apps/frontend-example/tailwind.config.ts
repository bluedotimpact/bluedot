import type { Config } from 'tailwindcss';

export default {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
    '../../packages/ui/src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        bluedot: {
          lighter: '#CCD7FF',
          light: '#6687FF',
          normal: '#0037FF',
          dark: '#002199',
          darker: '#00114D',
        },
        agisf: {
          lighter: '#E6B3FF',
          light: '#D680FF',
          normal: '#C64EFF',
          dark: '#9C00E5',
          darker: '#560080',
        },
        pandemics: {
          lighter: '#C7F7C0',
          light: '#78EB66',
          normal: '#34CE1B',
          dark: '#1D7510',
          darker: '#11430A',
        },
        cream: {
          normal: '#FFFCF7',
          dark: '#D9D6D2',
        },
      },
      fontFamily: {
        sans: 'Roobert, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"',
        serif: '"Reckless Neue", ui-serif, Georgia, Cambria, "Times New Roman", Times, serif',
      },
    },
  },
  plugins: [],
} satisfies Config;
