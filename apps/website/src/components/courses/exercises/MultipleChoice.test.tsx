import '@testing-library/jest-dom';
import { render, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import axios from 'axios';
import { useRouter } from 'next/router';
import {
  beforeEach, describe, expect, Mock, test, vi,
} from 'vitest';
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

const mockOptions = "The community's preference for low-tech fishing traditions\nRising consumer demand for fish with more Omega-3s\nEnvironmental regulations and declining cod stocks\nA cultural shift toward vegetarianism in the region\n";

const mockArgs = {
  title: 'Understanding LLMs',
  description:
    "Why is a language model's ability to predict 'the next word' capable of producing complex behaviors like solving maths problems?",
  options: mockOptions,
  answer: "The community's preference for low-tech fishing traditions\n",
  onExerciseSubmit: () => {},
};

describe('MultipleChoice', () => {
  test('renders default as expected', async () => {
    const { container, getByText, getAllByRole } = render(<MultipleChoice {...mockArgs} />);

    // Wait for MarkdownExtendedRenderer to complete async rendering
    await waitFor(() => {
      expect(getByText(mockArgs.description)).toBeInTheDocument();
    });

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
    const { container, getByText, getAllByRole } = render(<MultipleChoice {...mockArgs} isLoggedIn />);

    // Wait for MarkdownExtendedRenderer to complete async rendering
    await waitFor(() => {
      expect(getByText(mockArgs.description)).toBeInTheDocument();
    });

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
    if (!radioInputs[0]) throw new Error('No radio inputs found');
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
    if (!firstOption) throw new Error('No radio input found');

    await user.click(firstOption);

    // Expect first radio to be checked, and others not
    expect(firstOption).toBeChecked();
    radioInputs.slice(1).forEach((input) => {
      expect(input).not.toBeChecked();
    });
  });

  test('updates styles for correct option', async () => {
    const { getByDisplayValue, getByText } = render(
      <MultipleChoice {...mockArgs} exerciseResponse={mockArgs.answer} isLoggedIn />,
    );

    // Wait for MarkdownExtendedRenderer to complete async rendering
    await waitFor(() => {
      expect(getByText(mockArgs.description)).toBeInTheDocument();
    });

    const correctRadio = getByDisplayValue(mockArgs.answer.trim());
    expect(correctRadio).toBeChecked();
    expect(correctRadio).toMatchSnapshot();
    expect(getByText('Correct! Quiz completed. 🎉')).toBeInTheDocument();
  });

  test('updates styles for incorrect option', async () => {
    const incorrectAnswer = 'Rising consumer demand for fish with more Omega-3s\n';
    const { getByDisplayValue, getByRole, getByText } = render(
      <MultipleChoice {...mockArgs} exerciseResponse={incorrectAnswer} isLoggedIn />,
    );

    // Wait for MarkdownExtendedRenderer to complete async rendering
    await waitFor(() => {
      expect(getByText(mockArgs.description)).toBeInTheDocument();
    });

    const incorrectRadio = getByDisplayValue(incorrectAnswer.trim());
    expect(incorrectRadio).toBeChecked();
    expect(incorrectRadio).toMatchSnapshot();

    const tryAgainButton = getByRole('button', { name: /try again/i });
    expect(tryAgainButton).toBeInTheDocument();
    expect(tryAgainButton).toMatchSnapshot();
  });
});
