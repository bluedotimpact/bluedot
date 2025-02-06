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
        borderRadius: {
          /* Design System Border Radius */
          'radius-sm': '0.25rem' /* 4px */, // equivalent to base
          'radius-md': '0.5rem' /* 8px */, // equivalent to lg
          ...config.theme?.extend?.borderRadius,
        },
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
          'size-xxs': ['var(--text-size-xxs)', { lineHeight: '1.2' }],
          'size-xs': ['var(--text-size-xs)', { lineHeight: '1.2' }],
          'size-sm': ['var(--text-size-sm)', { lineHeight: '1.2' }],
          'size-md': ['var(--text-size-md)', { lineHeight: '1.2' }],
          'size-lg': ['var(--text-size-lg)', { lineHeight: '1.2' }],
          'size-xl': ['var(--text-size-xl)', { lineHeight: '1.2' }],
          ...config.theme?.extend?.fontSize,
        },
        spacing: {
          'max-width': 'var(--max-width)',
          'spacing-x': 'var(--spacing-x)',
          'spacing-y': 'var(--spacing-y)',
          'space-between': 'var(--space-between)',
          ...config.theme?.extend?.spacing,
        },
        animation: {
          'infinite-scroll': 'infinite-scroll 25s linear infinite',
        },
        keyframes: {
          'infinite-scroll': {
            from: { transform: 'translateX(0)' },
            to: { transform: 'translateX(-100%)' },
          },
        },
      },
    },
  });
};
