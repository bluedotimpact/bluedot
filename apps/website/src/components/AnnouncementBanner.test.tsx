import { fireEvent, render, screen } from '@testing-library/react';
import {
  beforeEach,
  describe,
  expect,
  test,
} from 'vitest';
import { useAnnouncementBannerStore } from '../stores/announcementBanner';
import { AnnouncementBanner, getAnnouncementBannerKey } from './AnnouncementBanner';
import { ONE_DAY_MS } from '../lib/constants';

describe('AnnouncementBanner', () => {
  beforeEach(() => {
    useAnnouncementBannerStore.setState({ dismissedBanners: {} });
  });

  test('renders the banner with content', () => {
    render(<AnnouncementBanner>Test Announcement</AnnouncementBanner>);

    expect(screen.getByText('Test Announcement')).toBeDefined();
  });

  test('renders with custom className', () => {
    const { container } = render(<AnnouncementBanner className="custom-class">Test Announcement</AnnouncementBanner>);

    const banner = container.firstElementChild;
    expect(banner?.className).toContain('custom-class');
  });

  test('renders label when provided', () => {
    render(<AnnouncementBanner label="From AI Safety Fundamentals">Test Announcement</AnnouncementBanner>);

    expect(screen.getByText('From AI Safety Fundamentals')).toBeDefined();
  });

  test('does not render CTA button when ctaUrl is not provided', () => {
    render(<AnnouncementBanner>Test Announcement</AnnouncementBanner>);

    expect(screen.queryByRole('link')).toBeNull();
  });

  test('renders CTA button when ctaUrl is provided', () => {
    render(<AnnouncementBanner ctaUrl="https://example.com">
      Test Announcement
    </AnnouncementBanner>);

    const ctaLink = screen.getByRole('link');
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
    const futureDate = new Date(Date.now() + ONE_DAY_MS);

    render(<AnnouncementBanner hideUntil={futureDate}>
      Test Announcement
    </AnnouncementBanner>);

    expect(screen.queryByText('Test Announcement')).toBeNull();
  });

  test('renders when current date is after hideUntil date', () => {
    const pastDate = new Date(Date.now() - ONE_DAY_MS);

    render(<AnnouncementBanner hideUntil={pastDate}>
      Test Announcement
    </AnnouncementBanner>);

    expect(screen.getByText('Test Announcement')).toBeDefined();
  });

  test('does not render when current date is after hideAfter date', () => {
    const pastDate = new Date(Date.now() - ONE_DAY_MS);

    render(<AnnouncementBanner hideAfter={pastDate}>
      Test Announcement
    </AnnouncementBanner>);

    expect(screen.queryByText('Test Announcement')).toBeNull();
  });

  test('renders when current date is before hideAfter date', () => {
    const futureDate = new Date(Date.now() + ONE_DAY_MS);

    render(<AnnouncementBanner hideAfter={futureDate}>
      Test Announcement
    </AnnouncementBanner>);

    expect(screen.getByText('Test Announcement')).toBeDefined();
  });

  test('does not render when banner has been dismissed', () => {
    const textContent = 'Test Announcement';
    const bannerKey = getAnnouncementBannerKey(textContent);

    // Set up dismissed banner state
    useAnnouncementBannerStore.setState({ dismissedBanners: { [bannerKey]: true } });

    render(<AnnouncementBanner>
      {textContent}
    </AnnouncementBanner>);

    expect(screen.queryByText(textContent)).toBeNull();
  });

  test('renders when banner has not been dismissed', () => {
    // Initial state has no dismissed banners (set in beforeEach)
    render(<AnnouncementBanner>
      Test Announcement
    </AnnouncementBanner>);

    expect(screen.getByText('Test Announcement')).toBeDefined();
  });

  test('calls dismissBanner when close button is clicked', () => {
    const textContent = 'Test Announcement';
    const bannerKey = getAnnouncementBannerKey(textContent);

    render(<AnnouncementBanner>
      {textContent}
    </AnnouncementBanner>);

    // Banner is initially shown
    expect(screen.getByText(textContent)).toBeDefined();

    const closeButton = screen.getByRole('button', { name: 'Close announcement' });
    fireEvent.click(closeButton);

    expect(useAnnouncementBannerStore.getState().dismissedBanners).toEqual({ [bannerKey]: true });

    // Banner should be closed
    expect(screen.queryByText(textContent)).toBeNull();
  });

  test('does not render dismiss button when dismissible is false', () => {
    render(<AnnouncementBanner dismissible={false}>
      Test Announcement
    </AnnouncementBanner>);

    expect(screen.getByText('Test Announcement')).toBeDefined();

    const closeButton = screen.queryByRole('button', { name: 'Close announcement' });
    expect(closeButton).toBeNull();
  });

  test('renders despite a persisted dismissal when dismissible is false', () => {
    const textContent = 'Test Announcement';
    const bannerKey = getAnnouncementBannerKey(textContent);

    useAnnouncementBannerStore.setState({ dismissedBanners: { [bannerKey]: true } });

    render(<AnnouncementBanner dismissible={false}>
      {textContent}
    </AnnouncementBanner>);

    expect(screen.getByText(textContent)).toBeDefined();
  });

  test('getAnnouncementBannerKey produces consistent keys', () => {
    const key1 = getAnnouncementBannerKey('Sample Announcement');
    const key2 = getAnnouncementBannerKey('Sample Announcement');
    const key3 = getAnnouncementBannerKey('Different Announcement');

    expect(key1).toBe(key2);
    expect(key1).not.toBe(key3);
  });
});
