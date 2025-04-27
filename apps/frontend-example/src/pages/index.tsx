import { useState } from 'react';
import {
  Button, LegacyText,
} from '@bluedot/ui';

const HomePage = () => {
  const [count, setCount] = useState(0);

  return (
    <div className="mx-8">
      <LegacyText.H1>frontend-example</LegacyText.H1>
      <LegacyText.P>This is some example text</LegacyText.P>
      <Button onPress={() => setCount((c) => c + 1)}>
        count is {count}
      </Button>
      <LegacyText.P>
        Edit <code>src/pages/index.tsx</code> and save to test HMR
      </LegacyText.P>
      <Button url="/authed">View page requiring auth</Button>
    </div>
  );
};

export default HomePage;
