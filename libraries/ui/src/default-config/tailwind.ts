import type { Config } from 'tailwindcss';

export const withDefaultBlueDotTailwindConfig = (config: Partial<Config> & { content?: string[] } = {}): Config => {
  return ({
    ...config,
    content: [
      './src/**/*.{js,ts,jsx,tsx,mdx}',
      '../../libraries/ui/src/**/*.{js,ts,jsx,tsx}',
      ...(config.content ?? []),
    ],
    theme: {
      ...config.theme,
      extend: {
        ...config.theme?.extend,
        colors: {
          bluedot: {
            lighter: '#CCD7FF',
            light: '#6687FF',
            normal: '#0037FF',
            dark: '#002199',
            darker: '#00114D',
            black: '#1E1E1E',
            canvas: 'var(--bluedot-cream-normal)',
          },
          aisf: {
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
            normal: 'var(--bluedot-cream-normal)',
            dark: '#D9D6D2',
          },
          ...config.theme?.extend?.colors,
        },
        fontFamily: {
          sans: 'Roobert, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"',
          serif: '"Reckless Neue", ui-serif, Georgia, Cambria, "Times New Roman", Times, serif',
          ...config.theme?.extend?.fontFamily,
        },
        spacing: {
          'max-width': '1440px',
          ...config.theme?.extend?.spacing,
        },
      },
    },
  });
};
