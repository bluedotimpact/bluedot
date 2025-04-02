import { render } from '@testing-library/react';
import { describe, expect, test } from 'vitest';
import { COURSE_UNITS } from '@bluedot/ui/src/constants';
import SideBar from './SideBar';

describe('SideBar', () => {
  test('renders default as expected', () => {
    const { container } = render(<SideBar units={COURSE_UNITS} currentUnit={COURSE_UNITS[0]} />);
    expect(container).toMatchSnapshot();
  });
});
