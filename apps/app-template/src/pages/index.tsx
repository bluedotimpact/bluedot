import { useState } from 'react';
import {
  CTALinkOrButton, H1, P,
} from '@bluedot/ui';
import { ExampleComponent } from '../components/ExampleComponent';

const HomePage = () => {
  const [count, setCount] = useState(0);

  return (
    <div className="section-body gap-2">
      <H1>app-template</H1>
      <P>This is some example text</P>
      <ExampleComponent />
      <CTALinkOrButton onClick={() => setCount((c) => c + 1)}>
        count is {count}
      </CTALinkOrButton>
      <P>You can test logging in below</P>
      <CTALinkOrButton url="/authed" withChevron>View page requiring auth</CTALinkOrButton>
    </div>
  );
};

export default HomePage;
