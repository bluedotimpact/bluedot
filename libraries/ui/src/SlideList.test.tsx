import { render, screen } from '@testing-library/react';
// eslint-disable-next-line import/no-extraneous-dependencies
import '@testing-library/jest-dom';
import {
  describe, it, expect,
} from 'vitest';
import { SlideList } from './SlideList';

describe('SlideList', () => {
  it('renders correctly', () => {
    render(
      <SlideList title="Our courses">
        <div>Slide 1</div>
        <div>Slide 2</div>
        <div>Slide 3</div>
      </SlideList>,
    );

    expect(screen.getByText('Our courses')).toBeInTheDocument();
    expect(screen.getAllByLabelText(/(Previous|Next) slide/)).toHaveLength(4);
  });
});
