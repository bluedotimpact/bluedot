import {
  describe,
  expect,
  test,
} from 'vitest';
import { render, screen, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import MyBlueDotLayout from './MyBlueDotLayout';
import { ROUTES } from '../lib/routes';

describe('MyBlueDotLayout', () => {
  test('renders children inside the main content area', () => {
    render(<MyBlueDotLayout route={ROUTES.account}>
      <div>Test Content</div>
    </MyBlueDotLayout>);

    const mainContent = screen.getByRole('main', { name: 'My BlueDot content' });
    expect(within(mainContent).getByText('Test Content')).toBeInTheDocument();
  });

  test('renders the My BlueDot navigation items', () => {
    render(<MyBlueDotLayout route={ROUTES.account}>
      <div>Test Content</div>
    </MyBlueDotLayout>);

    expect(screen.getByText('My Courses')).toBeInTheDocument();
    expect(screen.getByText('Account')).toBeInTheDocument();
  });
});
