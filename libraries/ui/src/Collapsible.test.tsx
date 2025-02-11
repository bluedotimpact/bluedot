import { describe, test, expect } from 'vitest';
import { fireEvent, render } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Collapsible } from './Collapsible';

describe('Collapsible', () => {
  test('renders correctly', () => {
    const { container } = render(
      <Collapsible title="Test Collapsible">
        <p>Test Content</p>
      </Collapsible>,
    );
    expect(container).toMatchSnapshot();
    // Renders collapsed by default
    expect(container.querySelector('.collapsible__content--collapsed')).not.toBeNull();
    expect(container.querySelector('.collapsible__content--expanded')).toBeNull();
  });

  test('opens on header click', () => {
    const { container } = render(
      <Collapsible title="Test Collapsible">
        <p>Test Content</p>
      </Collapsible>,
    );
    const header = container.querySelector('.collapsible__header');
    expect(header).not.toBeNull();

    fireEvent.click(header!);

    // Expands on click
    expect(container.querySelector('.collapsible__content--collapsed')).toBeNull();
    expect(container.querySelector('.collapsible__content--expanded')).not.toBeNull();

    fireEvent.click(header!);

    // Collapses on second click
    expect(container.querySelector('.collapsible__content--collapsed')).not.toBeNull();
    expect(container.querySelector('.collapsible__content--expanded')).toBeNull();
  });

  test('content is not interactive when collapsed', () => {
    const { container } = render(
      <Collapsible title="Test Collapsible">
        <a href="#test">Test Link</a>
      </Collapsible>,
    );

    // When collapsed
    const content = container.querySelector('.collapsible__content');
    expect(content).toHaveClass('pointer-events-none');
    expect(content).not.toHaveClass('pointer-events-auto');
    expect(content?.getAttribute('aria-hidden')).toBe('true');

    // When expanded
    const header = container.querySelector('.collapsible__header');
    fireEvent.click(header!);

    expect(content).toHaveClass('pointer-events-auto');
    expect(content).not.toHaveClass('pointer-events-none');
    expect(content?.getAttribute('aria-hidden')).toBe('false');
  });
});
