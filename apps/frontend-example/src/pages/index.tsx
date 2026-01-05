import { useState } from 'react';
import {
  CTALinkOrButton, H1, P,
} from '@bluedot/ui';

const HomePage = () => {
  const [count, setCount] = useState(0);

  return (
    <div className="section-body gap-2">
      <H1>frontend-example</H1>
      <P>This is some example text</P>
      <CTALinkOrButton onClick={() => setCount((c) => c + 1)}>
        Click count is {count}
      </CTALinkOrButton>
      <P>
        Edit <code>src/pages/index.tsx</code> and save to test HMR
      </P>
      <CTALinkOrButton url="/authed" withChevron>View page requiring auth</CTALinkOrButton>
    </div>
  );
};

export default HomePage;
