import { render, waitFor } from '@testing-library/react';
import { describe, expect, test } from 'vitest';
import MultipleChoice from './MultipleChoice';

const mockOptions = 'The community\'s preference for low-tech fishing traditions\nRising consumer demand for fish with more Omega-3s\nEnvironmental regulations and declining cod stocks\nA cultural shift toward vegetarianism in the region\n';

const mockArgs = {
  title: 'Understanding LLMs',
  description: 'Why is a language model\'s ability to predict \'the next word\' capable of producing complex behaviors like solving maths problems?',
  options: mockOptions,
  answer: 'The community\'s preference for low-tech fishing traditions\n',
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
    const optionEls = container.querySelectorAll('.multiple-choice__input');
    const optionEl = optionEls[0] as HTMLInputElement;
    const optionLabelEl = optionEl.closest('label') as HTMLElement;
    optionEl?.click();
    // Expect 'selected' state change
    await waitFor(() => {
      const selectedOption = container.querySelectorAll('.multiple-choice__option--selected');
      expect(selectedOption.length).toBe(1);
      expect(selectedOption[0]).toBe(optionLabelEl);
    });
  });

  test('updates styles for correct option', async () => {
    const { container } = render(
      <MultipleChoice
        {...mockArgs}
      />,
    );
    // Select the correct option
    const optionEls = container.querySelectorAll('.multiple-choice__input');
    const optionEl = optionEls[0] as HTMLInputElement;
    const optionLabelEl = optionEl.closest('label') as HTMLElement;
    optionEl?.click();
    // Submit the answer
    const submitEl = container.querySelector('.multiple-choice__submit') as HTMLElement;
    expect(submitEl).toBeTruthy();
    submitEl?.click();
    // Expect 'correct' state change
    await waitFor(() => {
      const correctOption = container.querySelectorAll('.multiple-choice__option--correct');
      expect(correctOption.length).toBe(1);
      expect(correctOption[0]).toBe(optionLabelEl);
      expect(container.querySelector('.multiple-choice__correct-msg')).toMatchSnapshot();
    });
  });

  test('updates styles for incorrect option', async () => {
    const { container } = render(
      <MultipleChoice
        {...mockArgs}
      />,
    );
    // Select the second option
    const optionEls = container.querySelectorAll('.multiple-choice__input');
    const optionEl = optionEls[1] as HTMLInputElement;
    const optionLabelEl = optionEl.closest('label') as HTMLElement;
    optionEl?.click();
    // Submit the answer
    const submitEl = container.querySelector('.multiple-choice__submit') as HTMLElement;
    expect(submitEl).toBeTruthy();
    submitEl?.click();
    // Expect 'incorrect' state change for the selected option
    await waitFor(() => {
      const incorrectOption = container.querySelectorAll('.multiple-choice__option--incorrect');
      expect(incorrectOption.length).toBe(1);
      expect(incorrectOption[0]).toBe(optionLabelEl);
      expect(container.querySelector('.multiple-choice__incorrect-msg')).toMatchSnapshot();
    });
  });
});
