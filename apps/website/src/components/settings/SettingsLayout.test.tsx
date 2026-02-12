import {
  describe,
  expect,
  test,
} from 'vitest';
import { render, screen, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import SettingsLayout from './SettingsLayout';
import { ROUTES } from '../../lib/routes';

describe('SettingsLayout', () => {
  test('renders complete layout structure with correct active tab', () => {
    const { container } = render(<SettingsLayout activeTab="account" route={ROUTES.settingsAccount}>
      <div>Test Content</div>
    </SettingsLayout>);

    // Snapshot only covers Settings side bar menu and main content changing
    expect(container).toMatchSnapshot();
  });

  test('renders different children based on activeTab prop', () => {
    const { rerender } = render(<SettingsLayout activeTab="account" route={ROUTES.settingsAccount}>
      <div>Account Settings Content</div>
    </SettingsLayout>);

    // Verify account content renders
    const mainContent = screen.getByRole('main', { name: 'Settings content' });
    expect(within(mainContent).getByText('Account Settings Content')).toBeInTheDocument();

    // Change to courses tab
    rerender(<SettingsLayout activeTab="courses" route={ROUTES.settingsCourses}>
      <div>Courses Settings Content</div>
    </SettingsLayout>);

    // Verify courses content renders
    expect(within(mainContent).getByText('Courses Settings Content')).toBeInTheDocument();
    expect(within(mainContent).queryByText('Account Settings Content')).not.toBeInTheDocument();
  });
});
