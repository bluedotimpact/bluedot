import { withDefaultBlueDotTailwindConfig } from '@bluedot/ui/src/default-config/tailwind';

/** @type {import('tailwindcss').Config} */
export default withDefaultBlueDotTailwindConfig({
  theme: {
    extend: {
      animation: {
        'infinite-scroll': 'infinite-scroll 25s linear infinite',
      },
      keyframes: {
        'infinite-scroll': {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
      },
    },
  },
});
