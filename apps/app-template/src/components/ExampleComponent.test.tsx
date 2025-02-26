import { render, screen } from '@testing-library/react';
import { describe, expect, test } from 'vitest';
import { ExampleComponent } from './ExampleComponent';

describe('ErrorPage', () => {
  test('should render the fallback correctly', () => {
    render(<ExampleComponent />);

    const heading = screen.getByRole('paragraph');
    expect(heading.textContent).toContain('Hello world!');
  });

  test('should render the greeting correctly', () => {
    render(<ExampleComponent name="Adam" />);

    const heading = screen.getByRole('paragraph');
    expect(heading.textContent).toContain('Hello Adam!');
  });
});
