import { withDefaultBlueDotTailwindConfig } from '@bluedot/ui/src/default-config/tailwind';
import {
  scopedPreflightStyles,
  isolateInsideOfContainer,
} from 'tailwindcss-scoped-preflight';

export default withDefaultBlueDotTailwindConfig({
  plugins: [
    scopedPreflightStyles({
      isolationStrategy: isolateInsideOfContainer('.bluedot-base'),
    }),
  ],
});
