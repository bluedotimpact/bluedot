import { withDefaultBlueDotVitestConfig } from '@bluedot/utils/src/default-config/vitest.mjs';

export default withDefaultBlueDotVitestConfig({
  test: {
    setupFiles: ['./vitest.setup.ts'],
  },
});
