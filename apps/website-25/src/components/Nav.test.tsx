import { describe, expect, test } from 'vitest';
import { render, waitFor, fireEvent } from '@testing-library/react';
import { Nav } from './Nav';

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
