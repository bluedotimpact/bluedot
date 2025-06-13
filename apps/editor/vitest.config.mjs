import { withDefaultBlueDotVitestConfig } from '@bluedot/utils/src/default-config/vitest.mjs';

export default withDefaultBlueDotVitestConfig({
  test: {
    server: {
      deps: {
        // This is necessary due to some weirdness about how tippy.js is imported
        inline: ['@syfxlin/tiptap-starter-kit'],
      },
    },
  },
});
