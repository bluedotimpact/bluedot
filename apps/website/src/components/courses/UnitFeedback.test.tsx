// eslint-disable-next-line @typescript-eslint/no-unused-vars
import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react';
import {
  describe,
  expect,
  test,
  vi,
  type Mock,
} from 'vitest';
import axios from 'axios';
import UnitFeedback from './UnitFeedback';

vi.mock('axios');
(axios.put as Mock).mockResolvedValue({ data: {} });

// `vi.mock` is hoisted to run once per file, so different tests can't use different
// mocks. This is a workaround for that.
const hasSubmittedRef = { hasSubmitted: false };

vi.mock('axios-hooks', () => ({
  default: vi.fn(() => [
    {
      data: {
        unitFeedback: hasSubmittedRef.hasSubmitted
          ? { overallRating: 3, anythingElse: '' }
          : undefined,
      },
    },
    { refetch: vi.fn() },
  ]),
}));

vi.mock('@bluedot/ui', async () => {
  const actual = await vi.importActual('@bluedot/ui');
  return {
    ...actual,
    useAuthStore: vi.fn().mockImplementation(() => ({ token: 'mockToken', expiresAt: Date.now() + 10000 })),
  };
});

describe('UnitFeedback', () => {
  const fakeUnit = { courseSlug: 'slug', id: 'unit123', unitNumber: '1' };

  test('should render correctly', () => {
    const { container } = render(<UnitFeedback unit={fakeUnit} />);
    expect(container).toMatchSnapshot();
  });

  test('shows error if submitting without a star', async () => {
    const { getByText, queryByText } = render(<UnitFeedback unit={fakeUnit} />);
    const submit = getByText(/send feedback/i);
    fireEvent.click(submit);

    await waitFor(() => {
      expect(queryByText(/select a star rating/i)).toBeTruthy();
    });
    expect(axios.put).not.toHaveBeenCalled();
  });

  test('calls axios.put with correct payload when a rating is submitted', async () => {
    const { getByLabelText, getByText, queryByText } = render(<UnitFeedback unit={fakeUnit} />);

    // click the 4-star button
    const fourStar = getByLabelText(/rate 4 stars/i);
    fireEvent.click(fourStar);

    const submit = getByText(/send feedback/i);
    fireEvent.click(submit);

    await waitFor(() => {
      expect(axios.put).toHaveBeenCalledWith(
        '/api/courses/slug/1/feedback',
        { overallRating: 4, anythingElse: '' },
        { headers: { Authorization: 'Bearer mockToken' } },
      );
      // no error shown to user
      expect(queryByText(/select a star rating/i)).toBeNull();
    });
  });

  test('calls axios.put with correct payload including anythingElse when provided', async () => {
    const { container, getByLabelText, getByText } = render(<UnitFeedback unit={fakeUnit} />);

    // click the 5-star button
    const fiveStar = getByLabelText(/rate 5 stars/i);
    fireEvent.click(fiveStar);

    const anythingElseInput = container.querySelector('.unit-feedback__textarea');
    fireEvent.change(anythingElseInput!, { target: { value: 'Great course!' } });

    const submit = getByText(/send feedback/i);
    fireEvent.click(submit);

    await waitFor(() => {
      expect(axios.put).toHaveBeenCalledWith(
        '/api/courses/slug/1/feedback',
        { overallRating: 5, anythingElse: 'Great course!' },
        { headers: { Authorization: 'Bearer mockToken' } },
      );
    });
  });

  test('shows "Feedback sent!" message if they have already submitted', async () => {
    hasSubmittedRef.hasSubmitted = true;

    const { queryByText } = render(<UnitFeedback unit={fakeUnit} />);

    await waitFor(() => {
      expect(queryByText(/Feedback sent!/i)).toBeTruthy();
    });

    hasSubmittedRef.hasSubmitted = false;
  });
});
