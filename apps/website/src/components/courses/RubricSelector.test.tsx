// eslint-disable-next-line @typescript-eslint/no-unused-vars
import React from 'react';
import { fireEvent, render } from '@testing-library/react';
import {
  describe, expect, test, vi,
} from 'vitest';
import { RubricSelector } from './ParticipantFeedbackModal';

const OPTIONS = [
  { value: 5, label: 'Went clearly above and beyond', description: 'Brought in outside resources.' },
  { value: 4, label: 'Took clear ownership of their learning', description: 'Exceptionally well-prepared.' },
  { value: 3, label: 'Consistently prepared and engaged at the expected level', description: 'Reliable participant.' },
  { value: 2, label: 'Inconsistently prepared', description: 'Didn\'t invest much.' },
  { value: 1, label: 'Frequently unprepared or disengaged', description: 'Little evidence of investment.' },
];

describe('RubricSelector', () => {
  test('renders all options', () => {
    const { getByText } = render(<RubricSelector
      name="show-up"
      ariaLabelledBy="show-up-label"
      options={OPTIONS}
      value={null}
      onChange={() => {}}
    />);

    OPTIONS.forEach((option) => {
      expect(getByText(option.label)).toBeTruthy();
    });
  });

  test('calls onChange when an option is clicked', () => {
    const onChange = vi.fn();
    const { getByText } = render(<RubricSelector
      name="show-up"
      ariaLabelledBy="show-up-label"
      options={OPTIONS}
      value={null}
      onChange={onChange}
    />);

    fireEvent.click(getByText('Took clear ownership of their learning'));
    expect(onChange).toHaveBeenCalledWith(4);
  });

  test('reflects the selected value', () => {
    const { container } = render(<RubricSelector
      name="show-up"
      ariaLabelledBy="show-up-label"
      options={OPTIONS}
      value={3}
      onChange={() => {}}
    />);

    const radios = container.querySelectorAll('input[type="radio"]');
    const checkedRadio = Array.from(radios).find((r) => (r as HTMLInputElement).checked) as HTMLInputElement;
    expect(checkedRadio).toBeTruthy();
    expect(checkedRadio.value).toBe('3');
  });

  test('shows description only for the selected option', () => {
    const { getByText, queryByText } = render(<RubricSelector
      name="show-up"
      ariaLabelledBy="show-up-label"
      options={OPTIONS}
      value={3}
      onChange={() => {}}
    />);

    // Selected option's description is visible
    expect(getByText('Reliable participant.')).toBeTruthy();
    // Other descriptions are not rendered
    expect(queryByText('Brought in outside resources.')).toBeNull();
    expect(queryByText('Exceptionally well-prepared.')).toBeNull();
    expect(queryByText('Didn\'t invest much.')).toBeNull();
    expect(queryByText('Little evidence of investment.')).toBeNull();
  });

  test('hides all descriptions when nothing is selected', () => {
    const { queryByText } = render(<RubricSelector
      name="show-up"
      ariaLabelledBy="show-up-label"
      options={OPTIONS}
      value={null}
      onChange={() => {}}
    />);

    OPTIONS.forEach((option) => {
      expect(queryByText(option.description)).toBeNull();
    });
  });

  test('is a semantic radiogroup', () => {
    const { container } = render(<RubricSelector
      name="show-up"
      ariaLabelledBy="show-up-label"
      options={OPTIONS}
      value={null}
      onChange={() => {}}
    />);

    expect(container.querySelector('[role="radiogroup"]')).toBeTruthy();
    expect(container.querySelectorAll('input[type="radio"]')).toHaveLength(5);
  });
});
