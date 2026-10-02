import path from 'path';
import { fileURLToPath } from 'url';
import { withDefaultBlueDotVitestConfig } from '@bluedot/utils/src/default-config/vitest.mjs';

const dirname = path.dirname(fileURLToPath(import.meta.url));

export default withDefaultBlueDotVitestConfig({
  // Test our copy, not the published package.
  resolve: {
    alias: {
      'mdast-util-gfm-autolink-literal': path.resolve(dirname, 'src/vendor/mdast-util-gfm-autolink-literal.js'),
    },
  },
  test: {
    setupFiles: ['./src/test-setup.ts'],
    environmentOptions: {
      happyDOM: {
        settings: {
          disableJavaScriptEvaluation: true,
        },
      },
    },
  },
});
