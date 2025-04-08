import { useState } from 'react';
import {
  Button, H1, P,
} from '@bluedot/ui';
import { ExampleComponent } from '../components/ExampleComponent';

const HomePage = () => {
  const [count, setCount] = useState(0);

  return (
    <div className="mx-8">
      <H1>app-template</H1>
      <P>This is some example text</P>
      <ExampleComponent />
      <Button onPress={() => setCount((c) => c + 1)}>
        count is {count}
      </Button>
      <P>You can test logging in below</P>
      <Button url="/authed">View page requiring auth</Button>
    </div>
  );
};

export default HomePage;
