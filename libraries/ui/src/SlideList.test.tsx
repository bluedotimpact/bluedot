import { render } from '@testing-library/react';
// eslint-disable-next-line import/no-extraneous-dependencies
import '@testing-library/jest-dom';
import {
  describe, it, expect,
} from 'vitest';
import { SlideList } from './SlideList';

describe('SlideList', () => {
  it('renders correctly', () => {
    const { container } = render(
      <SlideList>
        <div>Slide 1</div>
        <div>Slide 2</div>
        <div>Slide 3</div>
      </SlideList>,
    );

    expect(container).toMatchSnapshot();
  });

  // TODO test isMobile vs not
  // TODO test resize observer
});
