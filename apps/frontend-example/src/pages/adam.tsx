import { useState } from 'react';
import {
  Button, H1, P,
} from '@bluedot/ui';

const AdamPage = () => {
  const [value, setValue] = useState(0);

  return (
    <div className="mx-8">
      <H1>Adam's page</H1>

      <P className="mt-8">Value is {value}</P>
      <Button onPress={() => setValue((c) => c + 1)}>+</Button>
    </div>
  );
};

export default AdamPage;
