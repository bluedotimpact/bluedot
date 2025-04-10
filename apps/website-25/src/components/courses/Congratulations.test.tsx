import { render } from '@testing-library/react';
import { describe, expect, test } from 'vitest';
import Congratulations from './Congratulations';

describe('Congratulations', () => {
  test('renders default as expected', () => {
    const { container } = render(
      <Congratulations
        courseTitle="Future of AI"
        courseUrl="https://course.bluedot.org/future-of-ai"
        referralCode="5SR7C4"
        text="I've just completed a free, 2-hour course on the future of AI and its impacts on society. Here are my takeaways:"
      />,
    );
    expect(container).toMatchSnapshot();
  });
});
