import { render, screen } from '@testing-library/react';
import { describe, expect, test } from 'vitest';
import { ErrorPage } from './ErrorPage';

describe('ErrorPage', () => {
  test('should render the error message correctly', () => {
    const errorMessage = 'This is an error message';
    render(<ErrorPage error={new Error(errorMessage)} />);

    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading.textContent).toContain('Error');

    const errorMessageElement = screen.getByText(errorMessage);
    expect(errorMessageElement).toBeDefined();
  });

  test('should render a default error message when the error is not an instance of Error', () => {
    const errorObject = { message: 'This is an error object' };
    render(<ErrorPage error={errorObject} />);

    const errorMessageElement = screen.getByText('{"message":"This is an error object"}');
    expect(errorMessageElement).toBeDefined();
  });
});
