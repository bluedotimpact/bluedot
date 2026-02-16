import { render } from '@testing-library/react';
import { describe, expect, test } from 'vitest';
import Congratulations from './Congratulations';
import { FOAI_COURSE_ID } from '../../lib/constants';

describe('Congratulations', () => {
  test('renders default as expected', () => {
    const { container } = render(<Congratulations
      courseTitle="Test Course"
      coursePath="/courses/test-course"
    />);
    expect(container).toMatchSnapshot();
  });

  test('renders with custom args', () => {
    const { container } = render(<Congratulations
      courseTitle="Test Course"
      coursePath="/courses/test-course"
      text="This is a custom text I've written for this course!"
    />);
    expect(container).toMatchSnapshot();
  });

  test('renders FoAI course with special component', () => {
    const { container } = render(<Congratulations
      courseTitle="Future of AI"
      coursePath="/courses/future-of-ai"
      courseId={FOAI_COURSE_ID}
    />);
    expect(container).toMatchSnapshot();
  });
});
