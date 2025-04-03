import { render } from '@testing-library/react';
import { describe, expect, test } from 'vitest';
import { COURSE_UNITS } from '@bluedot/ui/src/constants';
import { BluedotRoute } from '@bluedot/ui/src/Breadcrumbs';
import UnitLayout from './UnitLayout';

describe('UnitLayout', () => {
  test('renders default as expected', () => {
    const { container } = render(
      <UnitLayout
        title="Unit 1"
        units={COURSE_UNITS}
        course="My Test Course"
        unit={1}
        route={{ title: 'Unit 1', url: '/course/my-test-course/unit/1' } as BluedotRoute}
        markdown="## Hello World!"
      />,
    );
    expect(container).toMatchSnapshot();
  });

  test('updates CTA for final unit', () => {
    const { container } = render(
      <UnitLayout
        title="Last Unit"
        units={COURSE_UNITS}
        course="My Test Course"
        unit={COURSE_UNITS.length}
        route={{ title: 'Last Unit', url: '/course/my-test-course/unit/1' } as BluedotRoute}
        markdown="## Hello World!"
      />,
    );
    expect(container.querySelector('.unit__cta-link')).toMatchSnapshot();
  });
});
