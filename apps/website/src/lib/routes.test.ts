import { describe, expect, test } from 'vitest';
import { ROUTES } from './routes';

describe('ROUTES configuration', () => {
  test('contains all required settings routes', () => {
    expect(ROUTES.settings).toBeDefined();
    expect(ROUTES.settingsAccount).toBeDefined();
    expect(ROUTES.settingsCourses).toBeDefined();
  });

  test('settings routes have correct URLs', () => {
    expect(ROUTES.settings.url).toBe('/settings');
    expect(ROUTES.settingsAccount.url).toBe('/settings/account');
    expect(ROUTES.settingsCourses.url).toBe('/settings/courses');
  });

  test('settings routes have correct titles', () => {
    expect(ROUTES.settings.title).toBe('Settings');
    expect(ROUTES.settingsAccount.title).toBe('Account');
    expect(ROUTES.settingsCourses.title).toBe('Courses');
  });

  test('settings routes have correct parent pages', () => {
    // Main settings page
    expect(ROUTES.settings.parentPages).toHaveLength(1);
    expect(ROUTES.settings.parentPages?.[0]).toBe(ROUTES.home);

    // Sub-pages
    expect(ROUTES.settingsAccount.parentPages).toHaveLength(2);
    expect(ROUTES.settingsAccount.parentPages?.[0]).toBe(ROUTES.home);
    expect(ROUTES.settingsAccount.parentPages?.[1]).toBe(ROUTES.settings);

    expect(ROUTES.settingsCourses.parentPages).toHaveLength(2);
    expect(ROUTES.settingsCourses.parentPages?.[0]).toBe(ROUTES.home);
    expect(ROUTES.settingsCourses.parentPages?.[1]).toBe(ROUTES.settings);
  });

  test('all existing routes are preserved', () => {
    // Ensure we haven't broken any existing routes
    expect(ROUTES.about).toBeDefined();
    expect(ROUTES.blog).toBeDefined();
    expect(ROUTES.certification).toBeDefined();
    expect(ROUTES.courses).toBeDefined();
    expect(ROUTES.home).toBeDefined();
    expect(ROUTES.login).toBeDefined();
    expect(ROUTES.logout).toBeDefined();
    expect(ROUTES.privacyPolicy).toBeDefined();
    expect(ROUTES.profile).toBeDefined();
    expect(ROUTES.projects).toBeDefined();
  });

  test('profile route still exists for backward compatibility', () => {
    expect(ROUTES.profile).toBeDefined();
    expect(ROUTES.profile.url).toBe('/profile');
    expect(ROUTES.profile.title).toBe('Profile');
  });
});
