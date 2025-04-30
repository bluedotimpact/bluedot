import { render, waitFor } from '@testing-library/react';
import {
  describe,
  expect,
  Mock,
  test,
  vi,
} from 'vitest';
import axios from 'axios';
import MultipleChoice from './MultipleChoice';

// Mock axios
vi.mock('axios');
(axios.put as Mock).mockResolvedValue({ data: {} });

const mockOptions = 'The community\'s preference for low-tech fishing traditions\nRising consumer demand for fish with more Omega-3s\nEnvironmental regulations and declining cod stocks\nA cultural shift toward vegetarianism in the region\n';

const mockArgs = {
  title: 'Understanding LLMs',
  description: 'Why is a language model\'s ability to predict \'the next word\' capable of producing complex behaviors like solving maths problems?',
  options: mockOptions,
  answer: 'The community\'s preference for low-tech fishing traditions\n',
  onExerciseSubmit: () => {},
};

describe('MultipleChoice', () => {
  test('renders default as expected', () => {
    const { container } = render(
      <MultipleChoice {...mockArgs} />,
    );

    expect(container).toMatchSnapshot();
    expect(container.querySelector('.multiple-choice__option--selected')).toBeFalsy();
  });

  test('renders logged in as expected', () => {
    const { container } = render(
      <MultipleChoice {...mockArgs} isLoggedIn />,
    );

    expect(container).toMatchSnapshot();
    expect(container.querySelector('.multiple-choice__option--selected')).toBeFalsy();
  });

  test('updates styles for selected option', async () => {
    const { container } = render(
      <MultipleChoice {...mockArgs} isLoggedIn />,
    );
    // Select the first option
    const optionEls = container.querySelectorAll('.multiple-choice__option .input--radio');
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

  test('updates styles for correct option', () => {
    const { container } = render(
      <MultipleChoice {...mockArgs} exerciseResponse={mockArgs.answer} isLoggedIn />,
    );
    // Expect only one correct option
    expect(container.querySelectorAll('.multiple-choice__option--correct').length).toBe(1);
    // Expect 'correct' UI
    const correctOption = container.querySelector('.multiple-choice__option--correct') as HTMLInputElement;
    expect(correctOption.textContent).toBe(mockArgs.answer.trim());
    expect(correctOption).toMatchSnapshot();
    expect(container.querySelector('.multiple-choice__correct-msg')).toMatchSnapshot();
  });

  test('updates styles for correct option', () => {
    const incorrectAnswer = 'Rising consumer demand for fish with more Omega-3s\n';
    const { container } = render(
      <MultipleChoice {...mockArgs} exerciseResponse={incorrectAnswer} isLoggedIn />,
    );
    // Expect only one incorrect option
    expect(container.querySelectorAll('.multiple-choice__option--incorrect').length).toBe(1);
    // Expect 'incorrect' UI
    const incorrectOption = container.querySelector('.multiple-choice__option--incorrect') as HTMLInputElement;
    expect(incorrectOption.textContent).toBe(incorrectAnswer.trim());
    expect(incorrectOption).toMatchSnapshot();
    expect(container.querySelector('.multiple-choice__incorrect-msg')).toMatchSnapshot();
  });
});
