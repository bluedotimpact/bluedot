import { withDefaultBlueDotTailwindConfig } from '@bluedot/ui/src/default-config/tailwind';

const config = {
  /**
   * tailwind prunes out classes that don't appear as strings in these
   * `content` files, so we need to add every path that has a story
   */
  content: ['../../apps/website-25/src/**/*.{js,ts,jsx,tsx,mdx}'],
};

export default withDefaultBlueDotTailwindConfig(config);
