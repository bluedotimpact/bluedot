import {
  beforeEach,
  describe, expect, type Mock, test,
  vi,
} from 'vitest';
import {
  render, screen, waitFor, fireEvent, within,
} from '@testing-library/react';
import { useAuthStore } from '@bluedot/ui';
import { useRouter } from 'next/router';
import { Nav } from './Nav';
import {
  createMockCourse, MOCK_NAV_GRANTS, MOCK_NAV_IN_PERSON_PROGRAMS,
} from '../../__tests__/testUtils';
import { server, trpcMsw } from '../../__tests__/trpcMswSetup';
import { TrpcProvider } from '../../__tests__/trpcProvider';

const mockCourses = [
  createMockCourse({
    id: '1',
    title: 'Featured Course',
    slug: 'agi-strategy',
    isFeatured: true,
    isNew: false,
  }),
  createMockCourse({
    id: '2',
    title: 'New Course',
    slug: 'ops',
    isFeatured: false,
    isNew: true,
  }),
  createMockCourse({
    id: '3',
    title: 'Project Sprint',
    slug: 'project-sprint',
    type: 'Project',
  }),
];

// Mock next/router
vi.mock('next/router', () => ({
  useRouter: vi.fn(),
}));

const mockRouter = {
  asPath: '/test-page',
  pathname: '/test-page',
  push: vi.fn(),
};

// Setup router mock and tRPC mock before each test
beforeEach(() => {
  (useRouter as unknown as Mock).mockReturnValue(mockRouter);
  server.use(
    trpcMsw.courses.getAll.query(() => mockCourses),
    trpcMsw.programs.getInPerson.query(() => MOCK_NAV_IN_PERSON_PROGRAMS),
    trpcMsw.programs.getGrants.query(() => MOCK_NAV_GRANTS),
  );
});

const withLoggedInUser = () => {
  useAuthStore.setState({
    auth: {
      email: 'test@example.com',
      token: 'mockToken',
      expiresAt: Date.now() + 86400_000,
      sub: 'mock-sub',
    },
  });
};

const withLoggedOutUser = () => {
  useAuthStore.setState({
    auth: null,
  });
};

/** Desktop and mobile each render a "Courses" trigger; mobile's lives inside the drawer. */
const getCoursesTrigger = (variant: 'mobile' | 'desktop') => {
  const drawer = document.getElementById('mobile-nav-drawer');
  const trigger = screen.getAllByRole('button', { name: 'Courses' })
    .find((btn) => (variant === 'mobile' ? drawer?.contains(btn) : !drawer?.contains(btn)));
  expect(trigger).toBeDefined();
  return trigger!;
};

const getControlledPanel = (trigger: HTMLElement) => {
  const panel = document.getElementById(trigger.getAttribute('aria-controls')!);
  expect(panel).not.toBeNull();
  return panel!;
};

const getHamburger = () => screen.getByRole('button', { name: /^(Open|Close) menu$/ });
const getMobileDrawer = () => document.getElementById('mobile-nav-drawer')!;
const getProfileDrawer = () => document.getElementById('profile-menu-drawer')!;

describe('Nav', () => {
  const testDropdownLinks = async (variant: 'mobile' | 'desktop') => {
    const coursesButton = getCoursesTrigger(variant);
    fireEvent.click(coursesButton);

    await waitFor(() => {
      const panel = within(getControlledPanel(coursesButton));
      const courseLinks = panel.getAllByRole('link');

      const foaiCourse = courseLinks.find((link) => link.textContent?.includes('Future of AI'));
      const featuredCourse = courseLinks.find((link) => link.textContent?.includes('Featured Course'));
      const newCourse = courseLinks.find((link) => link.textContent?.includes('New Course'));
      const projectSprint = courseLinks.find((link) => link.textContent?.includes('Project Sprint'));
      const seeAllCourses = courseLinks.find((link) => link.textContent?.startsWith('See all courses'));

      // FoAI is hardcoded as the orient course at the top of the dropdown
      expect(foaiCourse?.getAttribute('href')).toBe('/courses/future-of-ai');
      expect(featuredCourse?.getAttribute('href')).toBe('/courses/agi-strategy');
      expect(newCourse?.getAttribute('href')).toBe('/courses/ops');
      expect(projectSprint?.getAttribute('href')).toBe('/courses/project-sprint');
      expect(seeAllCourses?.getAttribute('href')).toBe('/courses');

      // Verify tags: one "Start Here" on FoAI, one "New" on new course
      const tagTexts = panel.getAllByRole('status').map((t) => t.textContent);
      expect(tagTexts).toContain('Start Here');
      expect(tagTexts).toContain('New');
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
      expect(screen.queryByText('Loading…')).toBeNull();
    });

    expect(container).toMatchSnapshot();
  });

  test('renders course links in mobile dropdown', async () => {
    render(<Nav />, { wrapper: TrpcProvider });
    await testDropdownLinks('mobile');
  });

  test('renders course links in desktop dropdown', async () => {
    render(<Nav />, { wrapper: TrpcProvider });
    await testDropdownLinks('desktop');
  });

  test('uses Grants and Programs as separate top-level menus', async () => {
    render(<Nav />, { wrapper: TrpcProvider });

    expect(screen.queryByRole('button', { name: 'Projects' })).toBeNull();
    expect(screen.getAllByRole('button', { name: 'Grants' }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole('button', { name: 'Programs' }).length).toBeGreaterThan(0);

    fireEvent.click(screen.getAllByRole('button', { name: 'Grants' })[0]!);
    expect((await screen.findAllByRole('link', { name: /Rapid Grants/i }))[0]?.getAttribute('href')).toBe('/grants/rapid');

    fireEvent.click(screen.getAllByRole('button', { name: 'Programs' })[0]!);
    expect((await screen.findAllByRole('link', { name: /AI Security Bootcamp/i }))[0]?.getAttribute('href')).toBe('https://aisb.dev/');
  });

  test('clicking the hamburger button expands the mobile nav drawer', async () => {
    withLoggedInUser();
    render(<Nav />, { wrapper: TrpcProvider });

    const hamburgerButton = getHamburger();
    const mobileNavDrawer = getMobileDrawer();
    const profileDrawer = getProfileDrawer();

    // Initially, both drawers should have a max height of 0 (closed state).
    expect(mobileNavDrawer.className).toMatch(/max-h-0/);
    expect(profileDrawer.className).toMatch(/max-h-0/);
    expect(hamburgerButton.getAttribute('aria-expanded')).toBe('false');

    fireEvent.click(hamburgerButton);

    await waitFor(() => {
      expect(mobileNavDrawer.className).not.toMatch(/max-h-0/);
      expect(profileDrawer.className).toMatch(/max-h-0/); // Profile drawer remains closed
      expect(hamburgerButton.getAttribute('aria-expanded')).toBe('true');
    });
  });

  test('clicking the profile menu button expands the profile drawer', async () => {
    withLoggedInUser();
    render(<Nav />, { wrapper: TrpcProvider });

    const profileButton = screen.getByRole('button', { name: 'Open profile menu' });
    const mobileNavDrawer = getMobileDrawer();
    const profileDrawer = getProfileDrawer();

    expect(mobileNavDrawer.className).toMatch(/max-h-0/);
    expect(profileDrawer.className).toMatch(/max-h-0/);

    fireEvent.click(profileButton);

    await waitFor(() => {
      expect(profileDrawer.className).not.toMatch(/max-h-0/);
      expect(mobileNavDrawer.className).toMatch(/max-h-0/); // Mobile nav drawer remains closed
    });
  });

  test('clicking outside the nav closes the drawer', async () => {
    render(<Nav />, { wrapper: TrpcProvider });

    const mobileNavDrawer = getMobileDrawer();
    fireEvent.click(getHamburger());

    await waitFor(() => {
      expect(mobileNavDrawer.className).not.toMatch(/max-h-0/);
    });

    // Simulate clicking outside the nav drawer (useClickOutside uses mousedown)
    fireEvent.mouseDown(document.body);

    await waitFor(() => {
      expect(mobileNavDrawer.className).toMatch(/max-h-0/);
    });
  });

  test('Escape closes the drawer and returns focus to the hamburger', async () => {
    render(<Nav />, { wrapper: TrpcProvider });

    const hamburgerButton = getHamburger();
    const mobileNavDrawer = getMobileDrawer();
    fireEvent.click(hamburgerButton);
    await waitFor(() => {
      expect(mobileNavDrawer.className).not.toMatch(/max-h-0/);
    });

    const aboutLink = within(mobileNavDrawer).getByRole('link', { name: 'About' });
    aboutLink.focus();
    fireEvent.keyDown(document, { key: 'Escape' });

    await waitFor(() => {
      expect(mobileNavDrawer.className).toMatch(/max-h-0/);
    });
    expect(document.activeElement).toBe(hamburgerButton);
  });

  test('Escape closes an open dropdown and returns focus to its trigger', async () => {
    render(<Nav />, { wrapper: TrpcProvider });

    const coursesButton = getCoursesTrigger('desktop');
    fireEvent.click(coursesButton);
    await waitFor(() => {
      expect(coursesButton.getAttribute('aria-expanded')).toBe('true');
    });

    fireEvent.keyDown(document, { key: 'Escape' });

    await waitFor(() => {
      expect(coursesButton.getAttribute('aria-expanded')).toBe('false');
    });
    expect(document.activeElement).toBe(coursesButton);
  });

  test('user can click a course link in the dropdown', async () => {
    render(<Nav />, { wrapper: TrpcProvider });

    const coursesButton = getCoursesTrigger('desktop');
    expect(coursesButton.getAttribute('aria-expanded')).toBe('false');

    fireEvent.click(coursesButton);

    await waitFor(() => {
      expect(coursesButton.getAttribute('aria-expanded')).toBe('true');
    });

    const desktopFeaturedCourseLink = await within(getControlledPanel(coursesButton)).findByRole('link', { name: /Featured Course/i });

    // Mousedown should not close the dropdown prematurely
    fireEvent.mouseDown(desktopFeaturedCourseLink);
    expect(coursesButton.getAttribute('aria-expanded')).toBe('true');

    fireEvent.click(desktopFeaturedCourseLink);

    await waitFor(() => {
      expect(coursesButton.getAttribute('aria-expanded')).toBe('false');
    });
  });

  test('marks the current section with aria-current, including on child routes', () => {
    (useRouter as unknown as Mock).mockReturnValue({ ...mockRouter, pathname: '/join-us/[slug]' });
    render(<Nav />, { wrapper: TrpcProvider });

    const joinUsLinks = screen.getAllByRole('link', { name: 'Join us' });
    expect(joinUsLinks.length).toBeGreaterThan(0);
    joinUsLinks.forEach((link) => expect(link.getAttribute('aria-current')).toBe('page'));
    screen.getAllByRole('link', { name: 'About' }).forEach((link) => expect(link.getAttribute('aria-current')).toBeNull());
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

  describe('minimal variant', () => {
    test('renders title and context without site links or auth CTAs', () => {
      withLoggedOutUser();
      render(<Nav variant="minimal" title="Course Feedback" context="Technical AI Safety (2026 Feb W08)" />, { wrapper: TrpcProvider });

      expect(screen.getByText('Course Feedback')).toBeDefined();
      expect(screen.getByText('Technical AI Safety (2026 Feb W08)')).toBeDefined();
      expect(screen.queryByRole('button', { name: 'Courses' })).toBeNull();
      expect(screen.queryByText('Sign in')).toBeNull();
      expect(screen.queryByText('Start for free')).toBeNull();
      expect(screen.queryByRole('button', { name: /profile menu/i })).toBeNull();
    });

    test('shows the profile menu when logged in', () => {
      withLoggedInUser();
      render(<Nav variant="minimal" title="Quick Apply" />, { wrapper: TrpcProvider });

      expect(screen.getByRole('button', { name: 'Open profile menu' })).toBeDefined();
      expect(screen.queryByRole('button', { name: /^(Open|Close) menu$/ })).toBeNull();
    });
  });
});
