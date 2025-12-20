import {
  beforeEach,
  describe, expect, Mock, test,
  vi,
} from 'vitest';
import {
  render, screen, waitFor, fireEvent,
} from '@testing-library/react';
import { useAuthStore } from '@bluedot/ui';
import { useRouter } from 'next/router';
import { Nav } from './Nav';
import { createMockCourse } from '../../__tests__/testUtils';
import { server, trpcMsw } from '../../__tests__/trpcMswSetup';
import { TrpcProvider } from '../../__tests__/trpcProvider';

const mockCourses = [
  createMockCourse({
    id: '1',
    title: 'Featured Course',
    description: 'Featured course description',
    slug: 'future-of-ai',
    path: '/courses/future-of-ai',
    image: '/images/courses/featured.jpg',
    durationDescription: '4 weeks',
    cadence: 'Weekly',
    isFeatured: true,
    isNew: false,
  }),
  createMockCourse({
    id: '2',
    title: 'New Course',
    description: 'New course description',
    slug: 'ops',
    path: '/courses/ops',
    image: '/images/courses/new.jpg',
    durationDescription: '2 weeks',
    cadence: 'Daily',
    isFeatured: false,
    isNew: true,
  }),
];

// Mock next/router
vi.mock('next/router', () => ({
  useRouter: vi.fn(),
}));

const mockRouter = {
  asPath: '/test-page',
  pathname: '/test-page',
};

// Setup router mock and tRPC mock before each test
beforeEach(() => {
  (useRouter as unknown as Mock).mockReturnValue(mockRouter);
  server.use(trpcMsw.courses.getAll.query(() => mockCourses));
});

const withLoggedInUser = () => {
  useAuthStore.setState({
    auth: {
      email: 'test@example.com',
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
  const testDropdownLinks = async (container: HTMLElement, variant: 'mobile' | 'desktop') => {
    const selector = variant === 'mobile' ? '.mobile-nav-links' : '.nav-links:not(.mobile-nav-links__nav-links)';

    // Find the correct button based on variant
    const coursesButton = screen.getAllByText('Courses')
      .find((btn) => (variant === 'mobile'
        ? btn.closest('.mobile-nav-links')
        : !btn.closest('.mobile-nav-links')));
    expect(coursesButton).not.toBeNull();

    // Click to open dropdown
    fireEvent.click(coursesButton!);

    // Wait for and verify course links
    await waitFor(() => {
      const courseLinks = container.querySelectorAll(`${selector} .nav-dropdown__dropdown-content a`);

      // Check specific course links and their URLs
      const featuredCourse = Array.from(courseLinks).find((link) => link.textContent?.includes('Featured Course'));
      const newCourse = Array.from(courseLinks).find((link) => link.textContent?.includes('New Course'));
      const seeUpcomingRounds = Array.from(courseLinks).find((link) => link.textContent === 'See upcoming rounds');

      expect(featuredCourse).toBeDefined();
      expect(featuredCourse?.getAttribute('href')).toBe('/courses/future-of-ai');

      expect(newCourse).toBeDefined();
      expect(newCourse?.getAttribute('href')).toBe('/courses/ops');

      expect(seeUpcomingRounds).toBeDefined();
      expect(seeUpcomingRounds?.getAttribute('href')).toBe('/courses');

      // Verify "New" tag
      const newTags = container.querySelectorAll(`${selector} .tag`);
      expect(newTags).toHaveLength(1);
      expect(newTags[0]!.textContent).toBe('New');
    });
  };

  test('renders with courses', async () => {
    const { container } = render(
      <Nav />,
      { wrapper: TrpcProvider },
    );

    // Wait for courses to load
    await waitFor(() => {
      // Check that we don't have any progress dots
      const progressDots = container.querySelectorAll('.progress-dots');
      expect(progressDots.length).toBe(0);
    });

    expect(container).toMatchSnapshot();
  });

  test('renders course links in mobile dropdown', async () => {
    const { container } = render(<Nav />, { wrapper: TrpcProvider });
    await testDropdownLinks(container, 'mobile');
  });

  test('renders course links in desktop dropdown', async () => {
    const { container } = render(<Nav />, { wrapper: TrpcProvider });
    await testDropdownLinks(container, 'desktop');
  });

  test('clicking the hamburger button expands the mobile nav drawer', async () => {
    withLoggedInUser();

    const { container } = render(
      <Nav />,
      { wrapper: TrpcProvider },
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
      <Nav />,
      { wrapper: TrpcProvider },
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
      <Nav />,
      { wrapper: TrpcProvider },
    );

    const hamburgerButton = container.querySelector('.mobile-nav-links__btn');
    expect(hamburgerButton).not.toBeNull();

    const mobileNavDrawer = container.querySelector('.mobile-nav-links__drawer');
    expect(mobileNavDrawer).not.toBeNull();

    fireEvent.click(hamburgerButton!);

    await waitFor(() => {
      expect(mobileNavDrawer!.className).not.toMatch(/max-h-0/);
    });

    // Simulate clicking outside the nav drawer (useClickOutside uses mousedown)
    fireEvent.mouseDown(document.body);

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

    render(<Nav />, { wrapper: TrpcProvider });

    // Check that the href includes the redirect_to parameter on all login buttons
    const loginButtons = screen.getAllByText('Sign in')
      .map((button) => button.closest('a'))
      .filter((Boolean)) as HTMLAnchorElement[];
    expect(loginButtons.length).toBeGreaterThanOrEqual(1);
    loginButtons.forEach((loginButton) => {
      expect(loginButton.getAttribute('href')).toContain(`redirect_to=${encodeURIComponent(mockPathname)}`);
    });
  });
});
