import { useState } from 'react';
import {
  Button, H1, P,
} from '@bluedot/ui';
import { withAuth } from '../lib/withAuth';

export const AuthedPage = withAuth(({ setAuth }) => {
  const [count, setCount] = useState(0);

  return (
    <div className="mx-8">
      <H1>Authed page</H1>
      <P>This is some example text</P>
      <Button onPress={() => setCount((c) => c + 1)}>
        count is {count}
      </Button>
      <Button onPress={() => setAuth(null)}>Logout</Button>
    </div>
  );
});
