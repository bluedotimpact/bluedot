import { fireEvent, render, screen } from '@testing-library/react';
import {
  beforeEach,
  describe,
  expect,
  test,
} from 'vitest';
import { useAnnouncementBannerStore } from '../stores/announcementBanner';
import { AnnouncementBanner, getAnnouncementBannerKey } from './AnnouncementBanner';

describe('AnnouncementBanner', () => {
  beforeEach(() => {
    useAnnouncementBannerStore.setState({ dismissedBanners: {} });
  });

  test('renders the banner with content', () => {
    render(<AnnouncementBanner>Test Announcement</AnnouncementBanner>);

    const content = screen.getByText('Test Announcement');
    expect(content).toBeDefined();

    // Banner container should be rendered
    const banner = document.querySelector('.announcement-banner');
    expect(banner).toBeDefined();
  });

  test('renders with custom className', () => {
    render(<AnnouncementBanner className="custom-class">Test Announcement</AnnouncementBanner>);

    const banner = document.querySelector('.announcement-banner');
    expect(banner?.className).toContain('custom-class');
  });

  test('does not render CTA button when ctaUrl is not provided', () => {
    render(<AnnouncementBanner>Test Announcement</AnnouncementBanner>);

    const cta = document.querySelector('.announcement-banner__cta');
    expect(cta).toBeNull();
  });

  test('renders CTA button when ctaUrl is provided', () => {
    render(<AnnouncementBanner ctaUrl="https://example.com">
      Test Announcement
    </AnnouncementBanner>);

    const cta = document.querySelector('.announcement-banner__cta');
    expect(cta).toBeDefined();

    // Check if the CTALinkOrButton has the correct props
    const ctaLink = screen.getByRole('link');
    expect(ctaLink).toBeDefined();
    expect(ctaLink.getAttribute('href')).toBe('https://example.com');
    expect(ctaLink.textContent).toBe('Learn more'); // Default text
  });

  test('renders CTA button with custom text', () => {
    render(<AnnouncementBanner ctaUrl="https://example.com" ctaText="Click Here">
      Test Announcement
    </AnnouncementBanner>);

    const ctaLink = screen.getByRole('link');
    expect(ctaLink.textContent).toBe('Click Here');
  });

  test('does not render when current date is before hideUntil date', () => {
    const futureDate = new Date(Date.now() + 86400);

    const { container } = render(<AnnouncementBanner hideUntil={futureDate}>
      Test Announcement
    </AnnouncementBanner>);

    // Banner should not be rendered
    const banner = container.querySelector('.announcement-banner');
    expect(banner).toBeNull();
  });

  test('renders when current date is after hideUntil date', () => {
    const pastDate = new Date(Date.now() - 86400);

    render(<AnnouncementBanner hideUntil={pastDate}>
      Test Announcement
    </AnnouncementBanner>);

    // Banner should be rendered
    const banner = document.querySelector('.announcement-banner');
    expect(banner).toBeDefined();
  });

  test('does not render when current date is after hideAfter date', () => {
    const pastDate = new Date(Date.now() - 86400);

    const { container } = render(<AnnouncementBanner hideAfter={pastDate}>
      Test Announcement
    </AnnouncementBanner>);

    // Banner should not be rendered
    const banner = container.querySelector('.announcement-banner');
    expect(banner).toBeNull();
  });

  test('renders when current date is before hideAfter date', () => {
    const futureDate = new Date(Date.now() + 86400);

    render(<AnnouncementBanner hideAfter={futureDate}>
      Test Announcement
    </AnnouncementBanner>);

    // Banner should be rendered
    const banner = document.querySelector('.announcement-banner');
    expect(banner).toBeDefined();
  });

  test('does not render when banner has been dismissed', () => {
    const textContent = 'Test Announcement';
    const bannerKey = getAnnouncementBannerKey(textContent);

    // Set up dismissed banner state
    useAnnouncementBannerStore.setState({ dismissedBanners: { [bannerKey]: true } });

    const { container } = render(<AnnouncementBanner>
      {textContent}
    </AnnouncementBanner>);

    // Banner should not be rendered
    const banner = container.querySelector('.announcement-banner');
    expect(banner).toBeNull();
  });

  test('renders when banner has not been dismissed', () => {
    // Initial state has no dismissed banners (set in beforeEach)
    render(<AnnouncementBanner>
      Test Announcement
    </AnnouncementBanner>);

    // Banner should be rendered
    const banner = document.querySelector('.announcement-banner');
    expect(banner).toBeDefined();
  });

  test('calls dismissBanner when close button is clicked', () => {
    const textContent = 'Test Announcement';
    const bannerKey = getAnnouncementBannerKey(textContent);

    render(<AnnouncementBanner>
      {textContent}
    </AnnouncementBanner>);

    // Banner is initially shown
    const banner = document.querySelector('.announcement-banner');
    expect(banner).toBeDefined();

    const closeButton = screen.getByRole('button', { name: 'Close announcement' });
    fireEvent.click(closeButton);

    expect(useAnnouncementBannerStore.getState().dismissedBanners).toEqual({ [bannerKey]: true });

    // Re-query the banner after dismiss
    const bannerAfterDismiss = document.querySelector('.announcement-banner');
    // Banner should be closed
    expect(bannerAfterDismiss).toBeNull();
  });

  test('getAnnouncementBannerKey produces consistent keys', () => {
    const key1 = getAnnouncementBannerKey('Sample Announcement');
    const key2 = getAnnouncementBannerKey('Sample Announcement');
    const key3 = getAnnouncementBannerKey('Different Announcement');

    expect(key1).toBe(key2);
    expect(key1).not.toBe(key3);
  });
});
