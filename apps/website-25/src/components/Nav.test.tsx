import {
  describe, expect, test,
  vi,
} from 'vitest';
import { render, waitFor, fireEvent } from '@testing-library/react';
import { Nav } from './Nav';

const mockLoggedInUser = () => {
  vi.mock('@bluedot/ui', async () => {
    const actual = await vi.importActual('@bluedot/ui');
    return {
      ...actual,
      useAuthStore: vi.fn().mockImplementation(() => ({
        auth: { token: 'mockToken', expiresAt: Date.now() + 10000 },
        setAuth: vi.fn(),
        _authClearTimer: null,
      })),
    };
  });
};

describe('Nav', () => {
  test('renders with courses', () => {
    const { container } = render(
      <Nav
        logo="logo.png"
        courses={[
          { title: 'Course 1', url: '/course1' },
          { title: 'Course 2', url: '/course2', isNew: true },
        ]}
      />,
    );
    expect(container).toMatchSnapshot();
  });

  test('clicking the hamburger button expands the mobile nav drawer', async () => {
    const { container } = render(
      <Nav courses={[{ title: 'Course 1', url: '/course1' }]} />,
    );

    const hamburgerButton = container.querySelector('.nav__menu--mobile-tablet');
    expect(hamburgerButton).not.toBeNull();

    const navDrawer = container.querySelector('.nav__drawer');
    expect(navDrawer).not.toBeNull();

    // Initially, the nav__drawer should have a max height of 0 (closed state).
    expect(navDrawer!.className).toMatch(/max-h-0/);

    fireEvent.click(hamburgerButton!);

    // The nav__drawer now has a max height that is not 0 (expanded state).
    await waitFor(() => {
      expect(navDrawer!.className).not.toMatch(/max-h-0/);
    });

    // Assert that the nav contents are showing but the contents of the profile menu are not
    expect(navDrawer!.textContent).toContain('Course 1');
    expect(navDrawer!.textContent).not.toContain('Log out');
  });

  test('clicking the profile menu button expands the profile drawer', async () => {
    mockLoggedInUser();

    const { container } = render(
      <Nav courses={[{ title: 'Course 1', url: '/course1' }]} />,
    );

    // Now the profile button should appear since we've mocked auth
    const profileButton = container.querySelector('.nav__profile-menu');
    expect(profileButton).not.toBeNull();

    const navDrawer = container.querySelector('.nav__drawer');
    expect(navDrawer).not.toBeNull();

    // Initially, the nav__drawer should have a max height of 0 (closed state).
    expect(navDrawer!.className).toMatch(/max-h-0/);

    fireEvent.click(profileButton!);

    // The nav__drawer now has a max height that is not 0 (expanded state).
    await waitFor(() => {
      expect(navDrawer!.className).not.toMatch(/max-h-0/);
    });

    // Assert that the profile contents are showing but the contents of the nav menu are not
    expect(navDrawer!.textContent).toContain('Log out');
    expect(navDrawer!.textContent).not.toContain('Course 1');

    vi.clearAllMocks();
  });

  test('clicking outside the nav closes the drawer', async () => {
    const { container } = render(
      <Nav courses={[{ title: 'Course 1', url: '/course1' }]} />,
    );

    const hamburgerButton = container.querySelector('.nav__menu--mobile-tablet');
    expect(hamburgerButton).not.toBeNull();

    const navDrawer = container.querySelector('.nav__drawer');
    expect(navDrawer).not.toBeNull();

    fireEvent.click(hamburgerButton!);

    await waitFor(() => {
      expect(navDrawer!.className).not.toMatch(/max-h-0/);
    });

    // Simulate clicking outside the nav drawer
    fireEvent.click(document.body);

    // Ensure the nav drawer is closed
    await waitFor(() => {
      expect(navDrawer!.className).toMatch(/max-h-0/);
    });
  });
});
