import { useState } from 'react';
import {
  Button, H1, P,
} from '@bluedot/ui';

const HomePage = () => {
  const [count, setCount] = useState(0);

  return (
    <div className="section-body gap-2">
      <H1>frontend-example</H1>
      <P>This is some example text</P>
      <Button onClick={() => setCount((c) => c + 1)}>
        Click count is {count}
      </Button>
      <P>
        Edit <code>src/pages/index.tsx</code> and save to test HMR
      </P>
      <Button url="/authed">View page requiring auth</Button>
    </div>
  );
};

export default HomePage;
