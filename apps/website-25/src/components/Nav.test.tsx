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
        internal_clearTimer: null,
        internal_refreshTimer: null,
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

    const mobileNavDrawer = container.querySelector('.nav__links-drawer');
    const profileDrawer = container.querySelector('.nav__profile-drawer');
    expect(mobileNavDrawer).not.toBeNull();
    expect(profileDrawer).not.toBeNull();

    // Initially, both drawers should have a max height of 0 (closed state).
    expect(mobileNavDrawer!.className).toMatch(/max-h-0/);
    expect(profileDrawer!.className).toMatch(/max-h-0/);

    fireEvent.click(hamburgerButton!);

    // The mobile nav drawer now has a max height that is not 0 (expanded state).
    await waitFor(() => {
      expect(mobileNavDrawer!.className).not.toMatch(/max-h-0/);
      expect(profileDrawer!.className).toMatch(/max-h-0/); // Profile drawer remains closed
    });
  });

  test('clicking the profile menu button expands the profile drawer', async () => {
    mockLoggedInUser();

    const { container } = render(
      <Nav courses={[{ title: 'Course 1', url: '/course1' }]} />,
    );

    const profileButton = container.querySelector('.nav__profile-menu');
    expect(profileButton).not.toBeNull();

    const mobileNavDrawer = container.querySelector('.nav__links-drawer');
    const profileDrawer = container.querySelector('.nav__profile-drawer');
    expect(mobileNavDrawer).not.toBeNull();
    expect(profileDrawer).not.toBeNull();

    // Initially, both drawers should have a max height of 0 (closed state).
    expect(mobileNavDrawer!.className).toMatch(/max-h-0/);
    expect(profileDrawer!.className).toMatch(/max-h-0/);

    fireEvent.click(profileButton!);

    // The profile drawer now has a max height that is not 0 (expanded state).
    await waitFor(() => {
      expect(profileDrawer!.className).not.toMatch(/max-h-0/);
      expect(mobileNavDrawer!.className).toMatch(/max-h-0/); // Mobile nav drawer remains closed
    });

    vi.clearAllMocks();
  });

  test('clicking outside the nav closes the drawer', async () => {
    const { container } = render(
      <Nav courses={[{ title: 'Course 1', url: '/course1' }]} />,
    );

    const hamburgerButton = container.querySelector('.nav__menu--mobile-tablet');
    expect(hamburgerButton).not.toBeNull();

    const navDrawer = container.querySelector('.nav__links-drawer');
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
