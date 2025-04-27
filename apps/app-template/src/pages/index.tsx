import { useState } from 'react';
import {
  Button, LegacyText,
} from '@bluedot/ui';
import { ExampleComponent } from '../components/ExampleComponent';

const HomePage = () => {
  const [count, setCount] = useState(0);

  return (
    <div className="mx-8">
      <LegacyText.H1>app-template</LegacyText.H1>
      <LegacyText.P>This is some example text</LegacyText.P>
      <ExampleComponent />
      <Button onPress={() => setCount((c) => c + 1)}>
        count is {count}
      </Button>
      <LegacyText.P>You can test logging in below</LegacyText.P>
      <Button url="/authed">View page requiring auth</Button>
    </div>
  );
};

export default HomePage;
