import { render, waitFor } from '@testing-library/react';
import {
  describe,
  expect,
  Mock,
  test,
  vi,
} from 'vitest';
import axios from 'axios';
import MultiSelect from './MultiSelect';

// Mock axios
vi.mock('axios');
(axios.put as Mock).mockResolvedValue({ data: {} });

const mockOptions = 'The community\'s preference for low-tech fishing traditions\nRising consumer demand for fish with more Omega-3s\nEnvironmental regulations and declining cod stocks\nA cultural shift toward vegetarianism in the region\n';

const mockArgs = {
  title: 'Understanding LLMs',
  description: 'Why is a language model\'s ability to predict \'the next word\' capable of producing complex behaviors like solving maths problems?',
  options: mockOptions,
  answer: 'The community\'s preference for low-tech fishing traditions\nRising consumer demand for fish with more Omega-3s\n',
  onExerciseSubmit: () => {},
};

describe('MultiSelect', () => {
  test('renders default as expected', () => {
    const { container } = render(
      <MultiSelect {...mockArgs} />,
    );

    expect(container).toMatchSnapshot();
    expect(container.querySelector('.multiselect__option--selected')).toBeFalsy();
  });

  test('renders logged in as expected', () => {
    const { container } = render(
      <MultiSelect {...mockArgs} isLoggedIn />,
    );

    expect(container).toMatchSnapshot();
    expect(container.querySelector('.multiselect__option--selected')).toBeFalsy();
  });

  test('updates styles for selected options', async () => {
    const { container } = render(
      <MultiSelect {...mockArgs} isLoggedIn />,
    );
    // Select the first two options
    const optionEls = container.querySelectorAll('.multiselect__input');
    const option1 = optionEls[0] as HTMLInputElement;
    const option2 = optionEls[1] as HTMLInputElement;
    const option1Label = option1.closest('label') as HTMLElement;
    const option2Label = option2.closest('label') as HTMLElement;

    option1?.click();
    option2?.click();

    // Expect 'selected' state change
    await waitFor(() => {
      const selectedOptions = container.querySelectorAll('.multiselect__option--selected');
      expect(selectedOptions.length).toBe(2);
      expect(selectedOptions[0]).toBe(option1Label);
      expect(selectedOptions[1]).toBe(option2Label);
    });
  });

  test('updates styles for correct options', () => {
    const { container } = render(
      <MultiSelect {...mockArgs} exerciseResponse={mockArgs.answer} isLoggedIn />,
    );
    // Expect correct options to be marked
    const correctOptions = container.querySelectorAll('.multiselect__option--correct');
    expect(correctOptions.length).toBe(2);
    // Expect 'correct' UI
    const correctOption1Text = correctOptions[0]!.textContent?.trim();
    const correctOption2Text = correctOptions[1]!.textContent?.trim();
    expect(correctOption1Text).toBe('The community\'s preference for low-tech fishing traditions');
    expect(correctOption2Text).toBe('Rising consumer demand for fish with more Omega-3s');
    expect(correctOptions[0]).toMatchSnapshot();
    expect(container.querySelector('.multiselect__correct-msg')).toMatchSnapshot();
  });

  test('updates styles for incorrect options', () => {
    const incorrectAnswer = 'Environmental regulations and declining cod stocks\nA cultural shift toward vegetarianism in the region\n';
    const { container } = render(
      <MultiSelect {...mockArgs} exerciseResponse={incorrectAnswer} isLoggedIn />,
    );
    // Expect incorrect options to be marked
    const incorrectOptions = container.querySelectorAll('.multiselect__option--incorrect');
    expect(incorrectOptions.length).toBe(2);
    // Expect 'incorrect' UI
    const incorrectOption1Text = incorrectOptions[0]!.textContent?.trim();
    const incorrectOption2Text = incorrectOptions[1]!.textContent?.trim();
    expect(incorrectOption1Text).toBe('Environmental regulations and declining cod stocks');
    expect(incorrectOption2Text).toBe('A cultural shift toward vegetarianism in the region');
    expect(incorrectOptions[0]).toMatchSnapshot();
    expect(container.querySelector('.multiselect__incorrect-msg')).toMatchSnapshot();
  });
});
