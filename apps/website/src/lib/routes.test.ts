import { describe, expect, test } from 'vitest';
import { ROUTES, shouldRedirectBackAfterLogout } from './routes';

describe('ROUTES configuration', () => {
  test('contains all required My BlueDot routes', () => {
    expect(ROUTES.account).toBeDefined();
    expect(ROUTES.myCourses).toBeDefined();
    expect(ROUTES.facilitatedCourses).toBeDefined();
  });

  test('My BlueDot routes have correct URLs', () => {
    expect(ROUTES.account.url).toBe('/account');
    expect(ROUTES.myCourses.url).toBe('/my-courses');
    expect(ROUTES.facilitatedCourses.url).toBe('/facilitated-courses');
  });

  test('My BlueDot routes have correct titles', () => {
    expect(ROUTES.account.title).toBe('Account');
    expect(ROUTES.myCourses.title).toBe('My Courses');
    expect(ROUTES.facilitatedCourses.title).toBe('Facilitated Courses');
  });

  test('My BlueDot routes have correct parent pages', () => {
    expect(ROUTES.account.parentPages).toHaveLength(1);
    expect(ROUTES.account.parentPages?.[0]).toBe(ROUTES.home);

    expect(ROUTES.myCourses.parentPages).toHaveLength(1);
    expect(ROUTES.myCourses.parentPages?.[0]).toBe(ROUTES.home);

    expect(ROUTES.facilitatedCourses.parentPages).toHaveLength(1);
    expect(ROUTES.facilitatedCourses.parentPages?.[0]).toBe(ROUTES.home);
  });

  test('all existing routes are preserved', () => {
    expect(ROUTES.about).toBeDefined();
    expect(ROUTES.blog).toBeDefined();
    expect(ROUTES.certification).toBeDefined();
    expect(ROUTES.courses).toBeDefined();
    expect(ROUTES.programs).toBeDefined();
    expect(ROUTES.home).toBeDefined();
    expect(ROUTES.login).toBeDefined();
    expect(ROUTES.logout).toBeDefined();
    expect(ROUTES.privacyPolicy).toBeDefined();
    expect(ROUTES.profile).toBeDefined();
  });

  test('programs route has correct URL and title', () => {
    expect(ROUTES.programs.url).toBe('/programs');
    expect(ROUTES.programs.title).toBe('Programs');
  });

  test('profile route still exists for backward compatibility', () => {
    expect(ROUTES.profile).toBeDefined();
    expect(ROUTES.profile.url).toBe('/profile');
    expect(ROUTES.profile.title).toBe('Profile');
  });
});

describe('shouldRedirectBackAfterLogout', () => {
  test('blocks auth-required My BlueDot pages (would error after logout)', () => {
    expect(shouldRedirectBackAfterLogout('/account')).toBe(false);
    expect(shouldRedirectBackAfterLogout('/my-courses')).toBe(false);
    expect(shouldRedirectBackAfterLogout('/facilitated-courses')).toBe(false);
    expect(shouldRedirectBackAfterLogout('/settings/courses')).toBe(false);
    expect(shouldRedirectBackAfterLogout('/profile')).toBe(false);
    expect(shouldRedirectBackAfterLogout('/admin')).toBe(false);
    expect(shouldRedirectBackAfterLogout('/admin/exercises')).toBe(false);
  });

  test('allows public pages', () => {
    expect(shouldRedirectBackAfterLogout('/courses')).toBe(true);
    expect(shouldRedirectBackAfterLogout('/')).toBe(true);
  });
});
