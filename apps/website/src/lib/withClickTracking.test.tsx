import { render, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { sendGAEvent } from '@next/third-parties/google';
import {
  describe, it, expect, beforeEach, vi,
} from 'vitest';
import { withClickTracking } from './withClickTracking';
// Mock the GA event tracking
vi.mock('@next/third-parties/google', () => ({
  sendGAEvent: vi.fn(),
}));

describe('withClickTracking', () => {
  // Simple component to wrap
  const DummyComponent = () => <div>Test Component</div>;

  beforeEach(() => {
    // Clear mock calls between tests
    vi.clearAllMocks();
  });

  it('tracks clicks with default configuration', () => {
    const WrappedComponent = withClickTracking(DummyComponent);
    const { container } = render(<WrappedComponent />);

    // Simulate click on the wrapper
    fireEvent.click(container.firstChild as HTMLElement);

    // Verify GA event was sent with default params
    expect(sendGAEvent).toHaveBeenCalledWith(
      'event',
      'click',
      {},
    );
  });

  it('tracks clicks with custom event name and params', () => {
    const WrappedComponent = withClickTracking(DummyComponent, {
      eventName: 'custom_click',
      eventParams: { category: 'test' },
    });

    const { container } = render(<WrappedComponent
      trackingEventName="button_click"
      trackingEventParams={{ action: 'submit' }}
    />);

    fireEvent.click(container.firstChild as HTMLElement);

    // Verify GA event was sent with merged configuration
    expect(sendGAEvent).toHaveBeenCalledWith(
      'event',
      'button_click',
      {
        category: 'test',
        action: 'submit',
      },
    );
  });

  it('renders the wrapped component with its original props', () => {
    type TestProps = {
      testProp: string;
    };
    const TestComponent = ({ testProp }: TestProps) => <div>{testProp}</div>;

    const WrappedComponent = withClickTracking(TestComponent);
    const { getByText } = render(<WrappedComponent testProp="Hello" />);

    expect(getByText('Hello')).toBeInTheDocument();
  });
});
