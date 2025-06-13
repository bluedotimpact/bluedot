import {
  describe, expect, test,
  vi,
} from 'vitest';
import {
  render, screen, waitFor, fireEvent,
} from '@testing-library/react';
import { useAuthStore } from '@bluedot/ui';
import { Nav } from './Nav';

const withLoggedInUser = () => {
  useAuthStore.setState({
    auth: {
      token: 'mockToken',
      expiresAt: Date.now() + 86400_000,
    },
  });
};

const withLoggedOutUser = () => {
  useAuthStore.setState({
    auth: null,
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
    withLoggedInUser();

    const { container } = render(
      <Nav courses={[{ title: 'Course 1', url: '/course1' }]} />,
    );

    const hamburgerButton = container.querySelector('.mobile-nav-links__btn');
    expect(hamburgerButton).not.toBeNull();

    const mobileNavDrawer = container.querySelector('.mobile-nav-links__drawer');
    const profileDrawer = container.querySelector('.profile-links__drawer');
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
    withLoggedInUser();

    const { container } = render(
      <Nav courses={[{ title: 'Course 1', url: '/course1' }]} />,
    );

    const profileButton = container.querySelector('.profile-links__btn');
    expect(profileButton).not.toBeNull();

    const mobileNavDrawer = container.querySelector('.mobile-nav-links__drawer');
    const profileDrawer = container.querySelector('.profile-links__drawer');
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

    const hamburgerButton = container.querySelector('.mobile-nav-links__btn');
    expect(hamburgerButton).not.toBeNull();

    const mobileNavDrawer = container.querySelector('.mobile-nav-links__drawer');
    expect(mobileNavDrawer).not.toBeNull();

    fireEvent.click(hamburgerButton!);

    await waitFor(() => {
      expect(mobileNavDrawer!.className).not.toMatch(/max-h-0/);
    });

    // Simulate clicking outside the nav drawer
    fireEvent.click(document.body);

    // Ensure the nav drawer is closed
    await waitFor(() => {
      expect(mobileNavDrawer!.className).toMatch(/max-h-0/);
    });
  });

  test('login button includes redirect_to parameter with current path', () => {
    withLoggedOutUser();
    const mockPathname = '/test-page';
    vi.spyOn(window, 'location', 'get').mockReturnValue({
      ...window.location,
      origin: 'https://bluedot.org',
      pathname: mockPathname,
    });

    render(<Nav courses={[{ title: 'Course 1', url: '/course1' }]} />);

    // Check that the href includes the redirect_to parameter on all login buttons
    const loginButtons = screen.getAllByText('Login')
      .map((button) => button.closest('a'))
      .filter((Boolean)) as HTMLAnchorElement[];
    expect(loginButtons.length).toBeGreaterThanOrEqual(1);
    loginButtons.forEach((loginButton) => {
      expect(loginButton.getAttribute('href')).toContain(`redirect_to=${encodeURIComponent(mockPathname)}`);
    });
  });
});
