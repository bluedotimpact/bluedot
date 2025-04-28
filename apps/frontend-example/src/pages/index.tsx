import { useState } from 'react';
import {
  CTALinkOrButton, NewText,
} from '@bluedot/ui';

const HomePage = () => {
  const [count, setCount] = useState(0);

  return (
    <div className="section-body gap-2">
      <NewText.H1>frontend-example</NewText.H1>
      <NewText.P>This is some example text</NewText.P>
      <CTALinkOrButton onClick={() => setCount((c) => c + 1)}>
        Click count is {count}
      </CTALinkOrButton>
      <NewText.P>
        Edit <code>src/pages/index.tsx</code> and save to test HMR
      </NewText.P>
      <CTALinkOrButton url="/authed" withChevron>View page requiring auth</CTALinkOrButton>
    </div>
  );
};

export default HomePage;
