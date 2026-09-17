import { describe, test, expect } from 'vitest';
import { fireEvent, render } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Collapsible } from './Collapsible';

describe('Collapsible', () => {
  test('renders to snapshot', () => {
    const { container } = render(<Collapsible title="Test Collapsible">
      <p>Test Content</p>
    </Collapsible>);
    expect(container).toMatchSnapshot();
  });

  test('toggles open on summary click', () => {
    const { container } = render(<Collapsible title="Test Collapsible">
      <p>Test Content</p>
    </Collapsible>);
    const details = container.querySelector('details')!;
    const summary = container.querySelector('summary')!;

    expect(details.open).toBe(false);
    fireEvent.click(summary);
    expect(details.open).toBe(true);
    fireEvent.click(summary);
    expect(details.open).toBe(false);
  });

  test('hides the chevron from assistive technology', () => {
    const { container } = render(<Collapsible title="Test Collapsible">
      <p>Test Content</p>
    </Collapsible>);
    expect(container.querySelector('summary svg')).toHaveAttribute('aria-hidden', 'true');
  });
});
