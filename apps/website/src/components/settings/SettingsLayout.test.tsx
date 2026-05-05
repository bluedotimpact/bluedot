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
    const { container } = render(<SettingsLayout activeTab="account" route={ROUTES.legacySettingsAccount}>
      <div>Test Content</div>
    </SettingsLayout>);

    expect(container).toMatchSnapshot();
  });

  test('renders different children based on activeTab prop', () => {
    const { rerender } = render(<SettingsLayout activeTab="account" route={ROUTES.legacySettingsAccount}>
      <div>Account Settings Content</div>
    </SettingsLayout>);

    const mainContent = screen.getByRole('main', { name: 'Settings content' });
    expect(within(mainContent).getByText('Account Settings Content')).toBeInTheDocument();

    rerender(<SettingsLayout activeTab="courses" route={ROUTES.legacySettingsCourses}>
      <div>Courses Settings Content</div>
    </SettingsLayout>);

    expect(within(mainContent).getByText('Courses Settings Content')).toBeInTheDocument();
    expect(within(mainContent).queryByText('Account Settings Content')).not.toBeInTheDocument();
  });
});
