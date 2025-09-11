import React from 'react';
import { render } from '@testing-library/react';
import {
  describe, expect, it, vi,
} from 'vitest';
import { ResourceListItem } from './ResourceListItem';

// Mock next-auth
vi.mock('next-auth/react', () => ({
  useSession: () => ({
    data: {
      user: {
        email: 'test@example.com',
        name: 'Test User',
      },
    },
    status: 'authenticated',
  }),
}));

// Mock next/router
vi.mock('next/router', () => ({
  useRouter: () => ({
    query: { courseSlug: 'test-course', unitNumber: '1' },
    pathname: '/courses/[courseSlug]/units/[unitNumber]',
    push: vi.fn(),
    replace: vi.fn(),
  }),
}));

// Mock FaviconImage component
vi.mock('./FaviconImage', () => ({
  FaviconImage: ({ url, alt }: { url: string; alt: string }) => (
    <img src={url} alt={alt} />
  ),
}));

// Mock MarkdownExtendedRenderer
vi.mock('./MarkdownExtendedRenderer', () => ({
  default: function MarkdownExtendedRenderer({ children, className }: { children: React.ReactNode; className?: string }) {
    return <div className={className}>{children}</div>;
  },
}));

describe('ResourceListItem - Listen to Article Feature', () => {
  const baseResource = {
    id: 'test-resource-1',
    resourceName: 'Introduction to AI Safety',
    resourceType: 'article',
    resourceLink: 'https://example.com/article',
    resourceGuide: 'This is a guide to the resource',
    authors: 'John Doe',
    timeFocusOnMins: 10,
    coreFurtherMaybe: null,
    readingOrder: null,
    unitId: 'unit123',
    avgRating: null,
    syncedAudioUrl: null,
    year: 2024,
    autoNumberId: null,
  };

  it('should render metadata without Listen to article button when no audio URL', () => {
    const { container, queryByText } = render(
      <ResourceListItem resource={baseResource} />,
    );

    // Should show author, year, and time
    expect(queryByText(/John Doe/)).toBeTruthy();
    expect(queryByText(/2024/)).toBeTruthy();
    expect(queryByText(/10 min/)).toBeTruthy();

    // Should NOT show Listen to article
    expect(queryByText('Listen to article')).toBeFalsy();

    expect(container.querySelector('.resource-item__bottom-metadata')).toMatchSnapshot();
  });

  it('should render Listen to article button when audio URL is provided', () => {
    const resourceWithAudio = {
      ...baseResource,
      syncedAudioUrl: 'https://open.spotify.com/episode/abc123',
    };

    const { container, getByText } = render(
      <ResourceListItem resource={resourceWithAudio} />,
    );

    // Should show author, time, and Listen to article
    expect(getByText(/John Doe/)).toBeTruthy();
    expect(getByText(/10 min/)).toBeTruthy();
    expect(getByText('Listen to article')).toBeTruthy();

    expect(container.querySelector('.resource-item__bottom-metadata')).toMatchSnapshot();
  });

  it('should render Listen to article with proper separator when metadata exists', () => {
    const resourceWithAudio = {
      ...baseResource,
      authors: 'Jane Smith',
      timeFocusOnMins: 15,
      syncedAudioUrl: 'https://open.spotify.com/episode/xyz789',
    };

    const { container } = render(
      <ResourceListItem resource={resourceWithAudio} />,
    );

    const metadata = container.querySelector('.resource-item__bottom-metadata');
    expect(metadata).toMatchSnapshot();

    // Check that separators are rendered
    const textContent = metadata?.textContent;
    expect(textContent).toContain('Jane Smith');
    expect(textContent).toContain('·');
    expect(textContent).toContain('15 min');
    expect(textContent).toContain('Listen to article');
  });

  it('should render Listen to article even without other metadata', () => {
    const resourceWithOnlyAudio = {
      ...baseResource,
      authors: null,
      timeFocusOnMins: null,
      syncedAudioUrl: 'https://open.spotify.com/episode/solo123',
    };

    const { container, getByText } = render(
      <ResourceListItem resource={resourceWithOnlyAudio} />,
    );

    // Should show Listen to article button even when no other metadata
    expect(getByText('Listen to article')).toBeTruthy();

    // Should show year and separator before audio button
    const metadata = container.querySelector('.resource-item__bottom-metadata');
    expect(metadata?.textContent).toContain('2024');
    expect(metadata?.textContent).toContain('·');
    expect(metadata?.textContent).toContain('Listen to article');

    expect(metadata).toMatchSnapshot();
  });

  it('should handle various metadata combinations with audio URL', () => {
    // Only author and audio
    const authorAndAudio = {
      ...baseResource,
      authors: 'Alice Brown',
      timeFocusOnMins: null,
      syncedAudioUrl: 'https://open.spotify.com/episode/author123',
    };

    const { container: container1 } = render(
      <ResourceListItem resource={authorAndAudio} />,
    );
    expect(container1.querySelector('.resource-item__bottom-metadata')).toMatchSnapshot();

    // Only time and audio
    const timeAndAudio = {
      ...baseResource,
      authors: null,
      timeFocusOnMins: 20,
      syncedAudioUrl: 'https://open.spotify.com/episode/time123',
    };

    const { container: container2 } = render(
      <ResourceListItem resource={timeAndAudio} />,
    );
    expect(container2.querySelector('.resource-item__bottom-metadata')).toMatchSnapshot();
  });

  it('should display year field correctly in metadata', () => {
    const { queryByText } = render(
      <ResourceListItem resource={baseResource} />,
    );

    // Should show year between author and time
    expect(queryByText(/2024/)).toBeTruthy();
  });

  it('should handle metadata without year field', () => {
    const resourceWithoutYear = {
      ...baseResource,
      year: null,
    };

    const { container, queryByText } = render(
      <ResourceListItem resource={resourceWithoutYear} />,
    );

    // Should show author and time but not year
    expect(queryByText(/John Doe/)).toBeTruthy();
    expect(queryByText(/10 min/)).toBeTruthy();
    expect(queryByText(/2024/)).toBeFalsy();

    // Check proper separator handling without year
    const metadata = container.querySelector('.resource-item__bottom-metadata');
    const textContent = metadata?.textContent;
    expect(textContent).toContain('John Doe');
    expect(textContent).toContain('·');
    expect(textContent).toContain('10 min');
  });

  it('should handle only year field in metadata', () => {
    const resourceWithOnlyYear = {
      ...baseResource,
      authors: null,
      timeFocusOnMins: null,
    };

    const { container, queryByText } = render(
      <ResourceListItem resource={resourceWithOnlyYear} />,
    );

    // Should show only year
    expect(queryByText(/2024/)).toBeTruthy();
    expect(queryByText(/John Doe/)).toBeFalsy();
    expect(queryByText(/10 min/)).toBeFalsy();

    // Should not have separators when only year is present
    const metadata = container.querySelector('.resource-item__bottom-metadata');
    expect(metadata?.textContent).not.toContain('·');
  });
});
