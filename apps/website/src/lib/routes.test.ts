import { describe, expect, test } from 'vitest';
import { ROUTES } from './routes';

describe('ROUTES configuration', () => {
  test('contains all required My BlueDot routes', () => {
    expect(ROUTES.account).toBeDefined();
    expect(ROUTES.myCourses).toBeDefined();
    expect(ROUTES.legacySettings).toBeDefined();
    expect(ROUTES.legacySettingsCourses).toBeDefined();
    expect(ROUTES.legacySettingsAccount).toBeDefined();
  });

  test('My BlueDot routes have correct URLs', () => {
    expect(ROUTES.account.url).toBe('/account');
    expect(ROUTES.myCourses.url).toBe('/my-courses');
    expect(ROUTES.legacySettings.url).toBe('/legacy/settings');
    expect(ROUTES.legacySettingsCourses.url).toBe('/legacy/settings/courses');
    expect(ROUTES.legacySettingsAccount.url).toBe('/legacy/settings/account');
  });

  test('My BlueDot routes have correct titles', () => {
    expect(ROUTES.account.title).toBe('Account');
    expect(ROUTES.myCourses.title).toBe('My Courses');
    expect(ROUTES.legacySettings.title).toBe('Settings');
    expect(ROUTES.legacySettingsCourses.title).toBe('Courses');
    expect(ROUTES.legacySettingsAccount.title).toBe('Account');
  });

  test('My BlueDot routes have correct parent pages', () => {
    expect(ROUTES.account.parentPages).toHaveLength(1);
    expect(ROUTES.account.parentPages?.[0]).toBe(ROUTES.home);

    expect(ROUTES.myCourses.parentPages).toHaveLength(1);
    expect(ROUTES.myCourses.parentPages?.[0]).toBe(ROUTES.home);

    expect(ROUTES.legacySettingsCourses.parentPages).toHaveLength(2);
    expect(ROUTES.legacySettingsCourses.parentPages?.[0]).toBe(ROUTES.home);
    expect(ROUTES.legacySettingsCourses.parentPages?.[1]).toBe(ROUTES.legacySettings);

    expect(ROUTES.legacySettingsAccount.parentPages).toHaveLength(2);
    expect(ROUTES.legacySettingsAccount.parentPages?.[0]).toBe(ROUTES.home);
    expect(ROUTES.legacySettingsAccount.parentPages?.[1]).toBe(ROUTES.legacySettings);
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
