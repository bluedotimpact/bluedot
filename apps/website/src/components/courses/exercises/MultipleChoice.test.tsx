import { render, waitFor } from '@testing-library/react';
import {
  beforeEach,
  describe,
  expect,
  Mock,
  test,
  vi,
} from 'vitest';
import axios from 'axios';
import { useRouter } from 'next/router';
import userEvent from '@testing-library/user-event';
import MultipleChoice from './MultipleChoice';

// Mock next/router
vi.mock('next/router', () => ({
  useRouter: vi.fn(),
}));

// Mock axios
vi.mock('axios');
(axios.put as Mock).mockResolvedValue({ data: {} });

const mockRouter = {
  asPath: '/test-path',
};

// Setup router mock before each test
beforeEach(() => {
  (useRouter as Mock).mockReturnValue(mockRouter);
});

const mockOptions = 'The community\'s preference for low-tech fishing traditions\nRising consumer demand for fish with more Omega-3s\nEnvironmental regulations and declining cod stocks\nA cultural shift toward vegetarianism in the region\n';

const mockArgs = {
  title: 'Understanding LLMs',
  description: 'Why is a language model\'s ability to predict \'the next word\' capable of producing complex behaviors like solving maths problems?',
  options: mockOptions,
  answer: 'The community\'s preference for low-tech fishing traditions\n',
  onExerciseSubmit: () => {},
};

describe('MultipleChoice', () => {
  test('renders default as expected', async () => {
    const { container } = render(
      <MultipleChoice {...mockArgs} />,
    );

    // Wait for MarkdownExtendedRenderer to complete async rendering
    await waitFor(() => {
      expect(container.querySelector('.multiple-choice__description')).toBeTruthy();
    });

    expect(container).toMatchSnapshot();
    expect(container.querySelector('.multiple-choice__option--selected')).toBeFalsy();
  });

  test('renders logged in as expected', async () => {
    const { container } = render(
      <MultipleChoice {...mockArgs} isLoggedIn />,
    );

    // Wait for MarkdownExtendedRenderer to complete async rendering
    await waitFor(() => {
      expect(container.querySelector('.multiple-choice__description')).toBeTruthy();
    });

    expect(container).toMatchSnapshot();
    expect(container.querySelector('.multiple-choice__option--selected')).toBeFalsy();
  });

  test('updates styles for selected option', async () => {
    const user = userEvent.setup();
    const { getAllByRole } = render(
      <MultipleChoice {...mockArgs} isLoggedIn />,
    );
    // Select the first option
    const radioInputs = getAllByRole('radio') as HTMLInputElement[];
    const firstOption = radioInputs[0];
    if (!firstOption) throw new Error('No radio input found');

    user.click(firstOption);
    firstOption.click();

    await waitFor(() => {
      // Expect first radio to be checked, and others not
      expect(firstOption.checked).toBe(true);
      radioInputs.slice(1).forEach((input) => {
        expect(input.checked).toBe(false);
      });
    });
  });

  test('updates styles for correct option', async () => {
    const { container } = render(
      <MultipleChoice {...mockArgs} exerciseResponse={mockArgs.answer} isLoggedIn />,
    );

    // Wait for MarkdownExtendedRenderer to complete async rendering
    await waitFor(() => {
      expect(container.querySelector('.multiple-choice__description')).toBeTruthy();
    });

    // Expect only one correct option
    expect(container.querySelectorAll('.multiple-choice__option--correct').length).toBe(1);
    // Expect 'correct' UI
    const correctOption = container.querySelector('.multiple-choice__option--correct') as HTMLInputElement;
    expect(correctOption.textContent).toBe(mockArgs.answer.trim());
    expect(correctOption).toMatchSnapshot();
    expect(container.querySelector('.multiple-choice__correct-msg')).toMatchSnapshot();
  });

  test('updates styles for incorrect option', async () => {
    const incorrectAnswer = 'Rising consumer demand for fish with more Omega-3s\n';
    const { container } = render(
      <MultipleChoice {...mockArgs} exerciseResponse={incorrectAnswer} isLoggedIn />,
    );

    // Wait for MarkdownExtendedRenderer to complete async rendering
    await waitFor(() => {
      expect(container.querySelector('.multiple-choice__description')).toBeTruthy();
    });

    // Expect only one incorrect option
    expect(container.querySelectorAll('.multiple-choice__option--incorrect').length).toBe(1);
    // Expect 'incorrect' UI
    const incorrectOption = container.querySelector('.multiple-choice__option--incorrect') as HTMLInputElement;
    expect(incorrectOption.textContent).toBe(incorrectAnswer.trim());
    expect(incorrectOption).toMatchSnapshot();
    expect(container.querySelector('.multiple-choice__incorrect-msg')).toMatchSnapshot();
  });
});
