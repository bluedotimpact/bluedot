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
          color: {
            /* Design System Colors */
            text: 'var(--bluedot-black)',
            'text-on-dark': 'var(--bluedot-cream-normal)',
            'secondary-text': 'var(--bluedot-darker)',
            canvas: 'var(--bluedot-cream-normal)',
            'canvas-dark': 'var(--bluedot-darker)',
            primary: 'var(--bluedot-normal)',
            secondary: 'var(--bluedot-lighter)',
            'primary-accent': 'var(--bluedot-normal)',
            'secondary-accent': 'var(--bluedot-lighter)',
            divider: 'var(--bluedot-charcoal-light)',
          },
          /* Brand Colors */
          /* We kept these for backwards compatibility. Avoid using them. Use Design System Colors instead. */
          bluedot: {
            lighter: 'var(--bluedot-lighter)',
            light: 'var(--bluedot-light)',
            normal: 'var(--bluedot-normal)',
            dark: 'var(--bluedot-dark)',
            darker: 'var(--bluedot-darker)',
            black: 'var(--bluedot-black)',
          },
          charcoal: {
            light: 'var(--bluedot-charcoal-light)',
            normal: 'var(--bluedot-charcoal-normal)',
          },
          aisf: {
            lighter: 'var(--bluedot-aisf-lighter)',
            light: 'var(--bluedot-aisf-light)',
            normal: 'var(--bluedot-aisf-normal)',
            dark: 'var(--bluedot-aisf-dark)',
            darker: 'var(--bluedot-aisf-darker)',
          },
          pandemics: {
            lighter: 'var(--bluedot-pandemics-lighter)',
            light: 'var(--bluedot-pandemics-light)',
            normal: 'var(--bluedot-pandemics-normal)',
            dark: 'var(--bluedot-pandemics-dark)',
            darker: 'var(--bluedot-pandemics-darker)',
          },
          cream: {
            normal: 'var(--bluedot-cream-normal)',
            dark: 'var(--bluedot-cream-dark)',
          },
          ...config.theme?.extend?.colors,
        },
        fontFamily: {
          sans: 'Roobert, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"',
          serif: '"Reckless Neue", ui-serif, Georgia, Cambria, "Times New Roman", Times, serif',
          ...config.theme?.extend?.fontFamily,
        },
        fontSize: {
          /* Design System Font Sizes */
          'design-s': ['0.75rem' /* 12px */, { lineHeight: '1rem' /* 16px */ }], // equivalent to xs
          'design-m': ['0.875rem' /* 14px */, { lineHeight: '1.25rem' /* 20px */ }], // equivalent to sm
          'design-l': ['1.5rem' /* 24px */, { lineHeight: '2rem' /* 32px */ }], // equivalent to 2xl
          'design-xl': ['3rem' /* 48px */, { lineHeight: '1' }], // equivalent to 5xl
          ...config.theme?.extend?.fontSize,
        },
        spacing: {
          'max-width': '1440px',
          'min-width': '388px',
          gutter: '16px',
          'gutter-sm': '8px',
          ...config.theme?.extend?.spacing,
        },
      },
    },
  });
};
