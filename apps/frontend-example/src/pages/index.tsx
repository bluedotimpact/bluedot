import { useState } from 'react';
import {
  Button, H1, P,
} from '@bluedot/ui';

const HomePage = () => {
  const [count, setCount] = useState(0);

  return (
    <div className="mx-8">
      <H1>frontend-example</H1>
      <P>This is some example text</P>
      <Button onPress={() => setCount((c) => c + 1)}>
        count is {count}
      </Button>
      <P>
        Edit <code>src/App.tsx</code> and save to test HMR
      </P>
      <Button url="/authed">View page requiring auth</Button>
    </div>
  );
};

export default HomePage;
