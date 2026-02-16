import { describe, test, expect } from 'vitest';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Collapsible } from './Collapsible';

describe('Collapsible', () => {
  test('renders to snapshot', () => {
    const { container } = render(<Collapsible title="Test Collapsible">
      <p>Test Content</p>
    </Collapsible>);
    expect(container).toMatchSnapshot();
  });

  test.skip('renders closed by default', () => {
    const { container } = render(<Collapsible title="Test Collapsible">
      <p id="my-awesome-content">Test Content</p>
    </Collapsible>);
    const summary = container.querySelector('summary');
    const content = container.querySelector('#my-awesome-content');
    expect(summary).not.toBeNull();
    expect(content).not.toBeNull();

    // Closed by default
    expect(summary).toBeVisible();
    expect(content).not.toBeVisible();
  });

  // Tests for expanding on click don't work with fireEvent as it doesn't simulate the browser properly
  // // Expands on click
  // fireEvent.click(summary!);
  // expect(summary).toBeVisible();
  // expect(content).toBeVisible();

  // // Collapses on second click
  // fireEvent.click(summary!);
  // expect(summary).toBeVisible();
  // expect(content).not.toBeVisible();
});
