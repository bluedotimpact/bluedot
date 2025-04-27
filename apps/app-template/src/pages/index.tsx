import { useState } from 'react';
import {
  CTALinkOrButton, NewText,
} from '@bluedot/ui';
import { ExampleComponent } from '../components/ExampleComponent';

const HomePage = () => {
  const [count, setCount] = useState(0);

  return (
    <div className="section-body gap-2">
      <NewText.H1>app-template</NewText.H1>
      <NewText.P>This is some example text</NewText.P>
      <ExampleComponent />
      <CTALinkOrButton onClick={() => setCount((c) => c + 1)}>
        count is {count}
      </CTALinkOrButton>
      <NewText.P>You can test logging in below</NewText.P>
      <CTALinkOrButton url="/authed" withChevron>View page requiring auth</CTALinkOrButton>
    </div>
  );
};

export default HomePage;
