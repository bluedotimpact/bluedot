import { render, waitFor } from '@testing-library/react';
import { describe, expect, test } from 'vitest';
import MultipleChoice from './MultipleChoice';

const mockOptions = [
  'The training data includes explicit instructions for these tasks',
  'The training data includes implicit instructions for these tasks',
  'The training data includes no instructions for these tasks',
];

const mockArgs = {
  title: 'Understanding LLMs',
  question: 'Why is a language model\'s ability to predict \'the next word\' capable of producing complex behaviors like solving maths problems?',
  options: mockOptions,
  correctOption: mockOptions[0] as string,
};

describe('MultipleChoice', () => {
  test('renders default as expected', () => {
    const { container } = render(
      <MultipleChoice {...mockArgs} />,
    );

    expect(container).toMatchSnapshot();
    expect(container.querySelector('.multiple-choice__option--selected')).toBeFalsy();
  });

  test('updates styles for selected option', async () => {
    const { container } = render(
      <MultipleChoice {...mockArgs} />,
    );
    // Select the first option
    const optionEl = container.querySelector(`input[value='${mockArgs.options[0]}']`) as HTMLElement;
    const optionLabelEl = optionEl.closest('label') as HTMLElement;
    optionEl?.click();
    // Expect 'selected' state change
    await waitFor(() => {
      expect(optionLabelEl.classList.contains('multiple-choice__option--selected')).toBe(true);
    });
  });

  test('updates styles for correct option', async () => {
    const { container } = render(
      <MultipleChoice
        {...mockArgs}
        correctOption={mockArgs.options[0] as string}
      />,
    );
    // Select the correct option
    const optionEl = container.querySelector(`input[value='${mockArgs.options[0]}']`) as HTMLElement;
    const optionLabelEl = optionEl.closest('label') as HTMLElement;
    expect(optionEl).toBeTruthy();
    optionEl?.click();
    // Submit the answer
    const submitEl = container.querySelector('.multiple-choice__submit') as HTMLElement;
    expect(submitEl).toBeTruthy();
    submitEl?.click();
    // Expect 'correct' state change
    await waitFor(() => {
      expect(optionLabelEl.classList.contains('multiple-choice__option--correct')).toBe(true);
    });
  });

  test('updates styles for incorrect option', async () => {
    const { container } = render(
      <MultipleChoice
        {...mockArgs}
        correctOption={mockArgs.options[0] as string}
      />,
    );
    // Select the second option
    const optionEl = container.querySelector(`input[value='${mockArgs.options[1]}']`) as HTMLElement;
    const optionLabelEl = optionEl.closest('label') as HTMLElement;
    expect(optionEl).toBeTruthy();
    optionEl?.click();
    // Submit the answer
    const submitEl = container.querySelector('.multiple-choice__submit') as HTMLElement;
    expect(submitEl).toBeTruthy();
    submitEl?.click();
    // Expect 'incorrect' state change
    await waitFor(() => {
      expect(optionLabelEl.classList.contains('multiple-choice__option--incorrect')).toBe(true);
    });
  });
});
