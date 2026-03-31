import {
  describe, expect, it, vi,
} from 'vitest';
import { createDiscussionCalendarIcs } from './calendar';

const unfoldIcs = (content: string) => content.replaceAll('\r\n ', '');

describe('calendar utilities', () => {
  it('creates an ics payload with discussion metadata and escaped links', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-31T12:00:00Z'));

    const { filename, content, summary } = createDiscussionCalendarIcs({
      discussionId: 'discussion-123',
      courseTitle: 'Introduction to AI Safety',
      coursePath: 'https://bluedot.org/courses/ai-safety/2',
      unitNumber: 2,
      unitTitle: 'Key Concepts',
      unitFallback: null,
      startDateTime: 1774954800,
      endDateTime: 1774958400,
      zoomLink: 'https://zoom.us/j/123456789?pwd=abc123',
      activityDoc: 'https://docs.google.com/document/d/abc123',
    });

    expect(summary).toBe('Introduction to AI Safety - Unit 2: Key Concepts');
    expect(filename).toBe('introduction-to-ai-safety-unit-2-key-concepts.ics');
    const unfoldedContent = unfoldIcs(content);

    expect(unfoldedContent).toContain('BEGIN:VCALENDAR');
    expect(unfoldedContent).toContain('UID:discussion-123@bluedot.org');
    expect(unfoldedContent).toContain('DTSTAMP:20260331T120000Z');
    expect(unfoldedContent).toContain('DTSTART:20260331T110000Z');
    expect(unfoldedContent).toContain('DTEND:20260331T120000Z');
    expect(unfoldedContent).toContain('SUMMARY:Introduction to AI Safety - Unit 2: Key Concepts');
    expect(unfoldedContent).toContain('Join Zoom: https://zoom.us/j/123456789?pwd=abc123');
    expect(unfoldedContent).toContain('Discussion doc: https://docs.google.com/document/d/abc123');
    expect(unfoldedContent).toContain('Course page: https://bluedot.org/courses/ai-safety/2');

    vi.useRealTimers();
  });

  it('folds long ics lines with continuation prefixes', () => {
    const { content } = createDiscussionCalendarIcs({
      discussionId: 'discussion-123',
      courseTitle: 'Introduction to AI Safety',
      coursePath: 'https://bluedot.org/courses/ai-safety/2',
      unitNumber: 2,
      unitTitle: 'Key Concepts',
      unitFallback: null,
      startDateTime: 1774954800,
      endDateTime: 1774958400,
      zoomLink: 'https://zoom.us/j/123456789?pwd=abc123&reallyLongParameter=this-should-force-the-url-line-to-fold-across-multiple-lines-for-calendar-clients',
      activityDoc: 'https://docs.google.com/document/d/abc123',
    });

    expect(content).toContain('\r\n ');
    expect(content).toContain('URL:https://zoom.us/j/123456789?pwd=abc123&reallyLongParameter=');
  });
});
