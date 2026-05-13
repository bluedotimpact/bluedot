import {
  describe,
  expect,
  test,
  vi,
} from 'vitest';
import { render, screen, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import MyBlueDotLayout from './MyBlueDotLayout';
import { ROUTES } from '../../lib/routes';

vi.mock('next/router', () => ({
  useRouter: () => ({ pathname: '/account' }),
}));

describe('MyBlueDotLayout', () => {
  test('renders children inside the content area', () => {
    render(<MyBlueDotLayout route={ROUTES.account}>
      <div>Test Content</div>
    </MyBlueDotLayout>);

    const content = screen.getByLabelText('My BlueDot content');
    expect(within(content).getByText('Test Content')).toBeInTheDocument();
  });

  test('renders the My BlueDot navigation items', () => {
    render(<MyBlueDotLayout route={ROUTES.account}>
      <div>Test Content</div>
    </MyBlueDotLayout>);

    const sidebarNav = screen.getByLabelText('My BlueDot');
    expect(within(sidebarNav).getByText('My Courses')).toBeInTheDocument();
    expect(within(sidebarNav).getByText('Account')).toBeInTheDocument();
  });
});
