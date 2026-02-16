import '@testing-library/jest-dom';
import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRouter } from 'next/router';
import {
  beforeEach, describe, expect, type Mock, test, vi,
} from 'vitest';
import MultipleChoice from './MultipleChoice';

// Mock next/router
vi.mock('next/router', () => ({
  useRouter: vi.fn(),
}));

const mockRouter = {
  asPath: '/test-path',
};

// Setup router mock before each test
beforeEach(() => {
  (useRouter as Mock).mockReturnValue(mockRouter);
});

const mockOptions = 'The community\'s preference for low-tech fishing traditions\nRising consumer demand for fish with more Omega-3s\nEnvironmental regulations and declining cod stocks\nA cultural shift toward vegetarianism in the region\n';
const incorrectAnswer = 'Rising consumer demand for fish with more Omega-3s\n';

const mockArgs = {
  options: mockOptions,
  answer: 'The community\'s preference for low-tech fishing traditions\n',
  onExerciseSubmit: () => Promise.resolve(),
};

describe('MultipleChoice', () => {
  test('renders default as expected', async () => {
    const { container, getAllByRole } = render(<MultipleChoice {...mockArgs} />);

    expect(container).toMatchSnapshot();

    // Expect no options to be selected
    const radioInputs = getAllByRole('radio');
    radioInputs.forEach((input) => {
      expect(input).not.toBeChecked();
      // All inputs are disabled until user is logged in
      expect(input).toBeDisabled();
    });
  });

  test('renders logged in as expected', async () => {
    const { container, getAllByRole } = render(<MultipleChoice {...mockArgs} isLoggedIn />);

    expect(container).toMatchSnapshot();

    // Expect no options to be selected
    const radioInputs = getAllByRole('radio');
    radioInputs.forEach((input) => {
      expect(input).not.toBeChecked();
      expect(input).toBeEnabled();
    });
  });

  test('disables submit button when no option selected', () => {
    const { getByRole } = render(<MultipleChoice {...mockArgs} isLoggedIn />);

    const submitButton = getByRole('button', { name: /select an option/i });
    expect(submitButton).toBeDisabled();
  });

  test('enables submit button when option selected', async () => {
    const user = userEvent.setup();
    const { getAllByRole, getByRole } = render(<MultipleChoice {...mockArgs} isLoggedIn />);

    const radioInputs = getAllByRole('radio');
    if (!radioInputs[0]) {
      throw new Error('No radio inputs found');
    }

    await user.click(radioInputs[0]);

    const submitButton = getByRole('button', { name: /check answer/i });
    expect(submitButton).toBeEnabled();
  });

  test('updates styles for selected option', async () => {
    const user = userEvent.setup();
    const { getAllByRole } = render(<MultipleChoice {...mockArgs} isLoggedIn />);
    // Select the first option
    const radioInputs = getAllByRole('radio');
    const firstOption = radioInputs[0];
    if (!firstOption) {
      throw new Error('No radio input found');
    }

    await user.click(firstOption);

    // Expect first radio to be checked, and others not
    expect(firstOption).toBeChecked();
    expect(firstOption).toMatchSnapshot();
    radioInputs.slice(1).forEach((input) => {
      expect(input).not.toBeChecked();
    });
  });

  test('updates styles for correct option', async () => {
    const { getAllByRole, getByDisplayValue } = render(<MultipleChoice {...mockArgs} exerciseResponse={mockArgs.answer} isLoggedIn />);

    const correctRadio = getByDisplayValue(mockArgs.answer.trim());
    expect(correctRadio).toBeChecked();
    expect(correctRadio).toMatchSnapshot();

    const radioInputs = getAllByRole('radio');
    radioInputs.forEach((input) => {
      // All inputs are disabled when answer is correct
      expect(input).toBeDisabled();
    });
  });

  test('updates styles for incorrect option', async () => {
    const { getByDisplayValue, getByRole } = render(<MultipleChoice {...mockArgs} exerciseResponse={incorrectAnswer} isLoggedIn />);

    const incorrectRadio = getByDisplayValue(incorrectAnswer.trim());
    expect(incorrectRadio).toBeChecked();
    expect(incorrectRadio).toMatchSnapshot();

    const tryAgainButton = getByRole('button', { name: /try again/i });
    expect(tryAgainButton).toBeInTheDocument();
    expect(tryAgainButton).toMatchSnapshot();
  });

  test('resets form when try again is clicked', async () => {
    const user = userEvent.setup();

    const { getByRole, getAllByRole } = render(<MultipleChoice {...mockArgs} exerciseResponse={incorrectAnswer} isLoggedIn />);

    const tryAgainButton = getByRole('button', { name: /try again/i });
    await user.click(tryAgainButton);

    const radioInputs = getAllByRole('radio');
    radioInputs.forEach((input) => {
      expect(input).not.toBeChecked();
    });

    const submitButton = getByRole('button', { name: /select an option/i });
    expect(submitButton).toBeDisabled();
  });

  test('shows correct result immediately after submitting correct answer', async () => {
    const user = userEvent.setup();
    const mockOnExerciseSubmit = vi.fn().mockResolvedValue(undefined);

    const { getAllByRole, queryByRole } = render(<MultipleChoice {...mockArgs} onExerciseSubmit={mockOnExerciseSubmit} isLoggedIn />);

    // Select the correct answer (first option)
    const radioInputs = getAllByRole('radio');
    if (!radioInputs[0]) {
      throw new Error('No radio inputs found');
    }

    await user.click(radioInputs[0]);

    // Submit the form
    const submitButton = queryByRole('button', { name: /check answer/i });
    if (!submitButton) throw new Error('Submit button not found');
    await user.click(submitButton);

    // onExerciseSubmit should be called with the answer and correct=true
    expect(mockOnExerciseSubmit).toHaveBeenCalledWith(mockArgs.answer.trim(), true);

    // All inputs should be disabled immediately (correct answer disables them)
    radioInputs.forEach((input) => {
      expect(input).toBeDisabled();
    });

    // Submit button should be gone (replaced by nothing for correct answers)
    expect(queryByRole('button', { name: /check answer/i })).not.toBeInTheDocument();
  });
});
