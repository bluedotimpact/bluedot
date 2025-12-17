import { render, RenderResult } from '@testing-library/react';
import type {
  Chunk,
  Course,
  CourseRegistration,
  Group,
  GroupDiscussion,
  MeetPerson,
  ResourceCompletion,
  Unit,
  UnitResource,
} from '@bluedot/db';
import { RESOURCE_FEEDBACK } from '@bluedot/db/src/schema';

// Re-export from libraries/ui for convenience
export { createMockOidcResponse } from '@bluedot/ui/src/utils/testUtils';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace JSX {
    // eslint-disable-next-line @typescript-eslint/consistent-type-definitions
    interface IntrinsicElements {
      'head-proxy': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
    }
  }
}

/**
 * Mock <Head> for testing. Based on the workaround described here:
 * https://github.com/vercel/next.js/discussions/11060#discussioncomment-33628
 *
 * Usage:
 * ```
 * vi.mock('next/head', () => ({
 *   __esModule: true,
 *   default: ({ children }: { children: React.ReactNode }) => (
 *     <head-proxy data-testid="head-proxy">{children}</head-proxy>
 *   ),
 * }));
 * ```
 */
export const renderWithHead = (ui: React.ReactElement): RenderResult => {
  const result = render(ui);

  const headProxies = document.querySelectorAll('head-proxy');
  headProxies.forEach((proxy) => {
    Array.from(proxy.childNodes).forEach((child) => {
      if (child.nodeType === Node.ELEMENT_NODE) {
        const clone = (child as Element).cloneNode(true);
        document.head.appendChild(clone);
      }
    });
  });

  return result;
};

const MOCK_COURSE_ID = 'course-id';
const MOCK_COURSE_REGISTRATION_ID = 'course-registration-id';
const MOCK_CHUNK_ID = 'chunk-id';
const MOCK_GROUP_ID = 'group-id';
const MOCK_MEET_PERSON_ID = 'meet-person-id';
const MOCK_RESOURCE_ID = 'resource-id';
const MOCK_RESOURCE_COMPLETION_ID = 'resource-completion-id';

export const createMockCourse = (overrides: Partial<Course> = {}): Course => ({
  averageRating: 4.5,
  cadence: 'Weekly',
  certificationBadgeImage: 'badge.png',
  certificationDescription: 'Certificate description',
  description: 'Course description',
  detailsUrl: 'https://example.com',
  displayOnCourseHubIndex: true,
  durationDescription: '4 weeks',
  durationHours: 40,
  id: MOCK_COURSE_ID,
  image: '/images/courses/default.jpg',
  isFeatured: false,
  isNew: false,
  level: 'Beginner',
  path: '/courses/course-slug',
  publicLastUpdated: null,
  shortDescription: 'Short description',
  slug: 'course-slug',
  status: 'published',
  title: 'Course Title',
  units: [],
  ...overrides,
});

export const createMockCourseRegistration = (overrides: Partial<CourseRegistration> = {}): CourseRegistration => ({
  autoNumberId: 1,
  certificateCreatedAt: null,
  certificateId: null,
  courseApplicationsBaseId: 'base123',
  courseId: MOCK_COURSE_ID,
  decision: 'Accept',
  email: 'user@example.com',
  firstName: 'Test',
  fullName: 'Test User',
  id: MOCK_COURSE_REGISTRATION_ID,
  lastName: 'User',
  lastVisitedChunkIndex: null,
  lastVisitedUnitNumber: null,
  role: 'Participant',
  roundStatus: 'Active',
  source: null,
  userId: 'user-1',
  ...overrides,
});

export const createMockUnit = (overrides: Partial<Unit> = {}): Unit => ({
  autoNumberId: 1,
  chunks: ['recuC87TILbjW4eF4'],
  content: null,
  courseId: MOCK_COURSE_ID,
  coursePath: '/courses/test-course',
  courseSlug: 'test-course',
  courseTitle: 'Test Course',
  courseUnit: null,
  description: 'Unit description',
  duration: 30,
  id: `unit-${overrides.unitNumber || 1}`,
  learningOutcomes: null,
  menuText: null,
  path: `/courses/test-course/${overrides.unitNumber || '1'}`,
  title: 'Unit title',
  unitNumber: '1',
  unitPodcastUrl: '',
  unitStatus: 'Active',
  ...overrides,
});

export const createMockChunk = (overrides: Partial<Chunk> = {}): Chunk => ({
  chunkContent: 'Test chunk content',
  chunkExercises: [],
  chunkId: 'recuC87TILbjW4eF4',
  chunkOrder: '1',
  chunkResources: [],
  chunkTitle: 'Test Chunk',
  chunkType: 'Reading',
  estimatedTime: null,
  id: MOCK_CHUNK_ID,
  metaDescription: null,
  status: 'Active',
  unitId: 'unit-id',
  ...overrides,
});

export const createMockGroup = (overrides: Partial<Group> = {}): Group => ({
  autoNumberId: 1,
  groupDiscussions: [],
  groupName: 'Group 1',
  id: MOCK_GROUP_ID,
  participants: [],
  round: 'round-1',
  startTimeUtc: Math.floor(Date.now() / 1000), // Unix timestamp in seconds
  whoCanSwitchIntoThisGroup: [],
  ...overrides,
});

export const createMockGroupDiscussion = (overrides: Partial<GroupDiscussion> = {}): GroupDiscussion => ({
  activityDoc: null,
  attendees: [],
  autoNumberId: 1,
  courseBuilderUnitRecordId: `unit-${overrides.unitNumber || 1}`,
  courseSite: null,
  endDateTime: Math.floor(Date.now() / 1000) + 2 * 60 * 60, // 2 hours from now (seconds)
  facilitators: [],
  group: MOCK_GROUP_ID,
  id: `discussion-${overrides.unitNumber || 1}`,
  participantsExpected: [],
  round: null,
  slackChannelId: null,
  startDateTime: Math.floor(Date.now() / 1000) + 60 * 60, // 1 hour from now (seconds)
  unit: `unit-${overrides.unitNumber || 1}`,
  unitNumber: 1,
  zoomAccount: null,
  zoomLink: null,
  ...overrides,
});

export const createMockMeetPerson = (overrides: Partial<MeetPerson> = {}): MeetPerson => ({
  id: MOCK_MEET_PERSON_ID,
  name: 'Test User',
  applicationsBaseRecordId: null,
  projectSubmission: [],
  role: 'Participant',
  buckets: [],
  round: null,
  expectedDiscussionsParticipant: [],
  expectedDiscussionsFacilitator: [],
  attendedDiscussions: [],
  uniqueDiscussionAttendance: null,
  numUnits: null,
  groupsAsParticipant: [],
  autoNumberId: 1,
  ...overrides,
});

export const createMockResource = (overrides: Partial<UnitResource> = {}): UnitResource => ({
  id: MOCK_RESOURCE_ID,
  resourceName: 'Introduction to AI Safety',
  resourceType: 'article',
  resourceLink: 'https://example.com/article',
  resourceGuide: 'This is a guide to the resource',
  authors: 'John Doe',
  timeFocusOnMins: 10,
  coreFurtherMaybe: 'Core',
  readingOrder: null,
  unitId: 'unit-1',
  avgRating: null,
  syncedAudioUrl: null,
  year: 2024,
  autoNumberId: 1,
  ...overrides,
});

export const createMockResourceCompletion = (overrides: Partial<ResourceCompletion> = {}): ResourceCompletion => ({
  autoNumberId: 1,
  email: '',
  feedback: null,
  id: MOCK_RESOURCE_COMPLETION_ID,
  isCompleted: false,
  rating: null,
  resourceFeedback: RESOURCE_FEEDBACK.NO_RESPONSE,
  unitResourceId: MOCK_RESOURCE_ID,
  unitResourceIdRead: MOCK_RESOURCE_ID,
  unitResourceIdWrite: MOCK_RESOURCE_ID,
  ...overrides,
});
