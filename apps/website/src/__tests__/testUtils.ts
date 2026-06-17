import type {
  Chunk,
  Course,
  CourseRegistration,
  Group,
  GroupDiscussion,
  MeetPerson,
  Program,
  ResourceCompletion,
  Unit,
  UnitResource,
} from '@bluedot/db';
import { RESOURCE_FEEDBACK } from '@bluedot/db/src/schema';
import { render, type RenderResult } from '@testing-library/react';
import type { CourseRound } from '../server/routers/course-rounds';

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

/** Default Programs router output for tests that render the Nav. */
export const MOCK_NAV_PROGRAMS: Program[] = [
  {
    id: 'rec-advising',
    name: '1-1 advising',
    status: 'Active',
    description: '30 min calls with the BlueDot team to accelerate you towards doing impactful work in AI safety.',
    applicationForm: 'https://example.com/advising',
    category: null,
    slug: 'advising',
    order: '1',
  },
  {
    id: 'rec-rapid',
    name: 'Rapid Grants',
    status: 'Active',
    description: 'Funding for the BlueDot community to ship projects, run events, and do other concrete work on AI safety and biosecurity.',
    applicationForm: 'https://example.com/rapid',
    category: 'Funding',
    slug: 'rapid-grants',
    order: '2',
  },
  {
    id: 'rec-ct',
    name: 'Career Transition Grants',
    status: 'Active',
    description: 'Funding and support to help you go full-time on AI safety and biosecurity.',
    applicationForm: 'https://example.com/ct',
    category: 'Funding',
    slug: 'career-transition-grant',
    order: '3',
  },
  {
    id: 'rec-incubator',
    name: 'Incubator Week',
    status: 'Active',
    description: '5 days. All expenses paid. $50k, equity-free, if we back your pitch. San Francisco, July 20–25. Applications close July 10.',
    applicationForm: 'https://example.com/incubator',
    category: 'Found',
    slug: 'incubator-week',
    order: '4',
  },
];

export const createMockCourse = (overrides: Partial<Course> = {}): Course => ({
  applyUrl: null,
  averageRating: 4.5,
  certificationBadgeImage: 'badge.png',
  certificationDescription: 'Certificate description',
  detailsUrl: 'https://example.com',
  displayOnCourseHubIndex: true,
  durationHours: 40,
  id: MOCK_COURSE_ID,

  isFeatured: false,
  isNew: false,
  publicLastUpdated: null,
  shortDescription: 'Short description',
  slug: 'course-slug',
  status: 'published',
  title: 'Course Title',
  type: 'Course',
  units: [],
  ...overrides,
});

export const createMockCourseRegistration = (overrides: Partial<CourseRegistration> = {}): CourseRegistration => ({
  autoNumberId: 1,
  availabilityComments: null,
  availabilityIntervalsUTC: null,
  availabilityTimezone: null,
  certificateCreatedAt: null,
  certificateId: null,
  courseApplicationsBaseId: 'base123',
  courseId: MOCK_COURSE_ID,
  decision: 'Accept',
  isDuplicate: null,
  formFeedback: null,
  impressiveProject: null,
  motivationToFacilitate: null,
  numGroupsToFacilitate: null,
  prevEngagement: null,
  prevFacilitationExperience: null,
  skills: null,
  email: 'user@example.com',
  firstName: 'Test',
  fullName: 'Test User',
  id: MOCK_COURSE_REGISTRATION_ID,
  lastName: 'User',
  role: 'Participant',
  roundId: 'round-1',
  roundName: 'sample round name',
  roundStatus: 'Active',
  source: null,
  userId: 'user-1',
  acceptedAt: null,
  createdAt: null,
  posthogSessionId: null,
  posthogDistinctId: null,
  ...overrides,
});

export const createMockUnit = (overrides: Partial<Unit> = {}): Unit => ({
  chunks: ['recuC87TILbjW4eF4'],
  courseId: MOCK_COURSE_ID,
  courseSlug: 'test-course',
  courseTitle: 'Test Course',
  courseUnit: null,
  duration: 30,
  // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
  id: `unit-${overrides.unitNumber || 1}`,
  title: 'Unit title',
  unitNumber: '1',
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
  facilitator: null,
  discussionDoc: null,
  groupNumber: null,
  slackChannelId: null,
  ...overrides,
});

export const createMockGroupDiscussion = (overrides: Partial<GroupDiscussion> = {}): GroupDiscussion => ({
  activityDoc: null,
  attendees: [],
  autoNumberId: 1,
  // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
  courseBuilderUnitRecordId: `unit-${overrides.unitNumber || 1}`,
  courseSite: null,
  endDateTime: Math.floor(Date.now() / 1000) + 2 * 60 * 60, // 2 hours from now (seconds)
  facilitators: [],
  group: MOCK_GROUP_ID,
  // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
  id: `discussion-${overrides.unitNumber || 1}`,
  participantsExpected: [],
  round: 'round-1',
  slackChannelId: null,
  startDateTime: Math.floor(Date.now() / 1000) + 60 * 60, // 1 hour from now (seconds)
  // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
  unit: `unit-${overrides.unitNumber || 1}`,
  unitFallback: `${overrides.unitNumber ?? 1}: Test Unit`,
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
  humanOpinion: null,
  round: null,
  expectedDiscussionsParticipant: [],
  expectedDiscussionsFacilitator: [],
  attendedDiscussions: [],
  uniqueDiscussionAttendance: null,
  numUnits: null,
  groupsAsParticipant: [],
  autoNumberId: 1,
  email: 'test@example.com',
  courseFeedbackForm: null,
  courseFeedback: null,
  hasSentInactiveEmail: false,
  firstName: null,
  lastName: null,
  payForFacilitatedDiscussions: null,
  slackProfileUrl: null,
  ...overrides,
});

export const createMockResource = (overrides: Partial<UnitResource> = {}): UnitResource => ({
  id: MOCK_RESOURCE_ID,
  resourceName: 'Introduction to AI Safety',
  resourceLink: 'https://example.com/article',
  resourceGuide: 'This is a guide to the resource',
  authors: 'John Doe',
  timeFocusOnMins: 10,
  coreFurtherMaybe: 'Core',
  readingOrder: null,
  unitId: 'unit-1',
  resourceId: null,
  syncedAudioUrl: null,
  year: 2024,
  autoNumberId: 1,
  ...overrides,
});

let mockRoundCounter = 0;

export const createMockRound = (overrides: Partial<CourseRound> = {}): CourseRound => {
  mockRoundCounter += 1;
  return {
    id: `round-${mockRoundCounter}`,
    intensity: 'intensive',
    applicationDeadline: '15 Jan',
    applicationDeadlineDetailed: '15 Jan at 23:59 UTC',
    applicationDeadlineRaw: '2025-01-15',
    firstDiscussionDateRaw: '2025-01-20',
    dateRange: '20 – 24 Jan',
    numberOfUnits: 5,
    ...overrides,
  };
};

export const createMockResourceCompletion = (overrides: Partial<ResourceCompletion> = {}): ResourceCompletion => ({
  autoNumberId: 1,
  email: '',
  feedback: null,
  id: MOCK_RESOURCE_COMPLETION_ID,
  isCompleted: false,
  resourceFeedback: RESOURCE_FEEDBACK.NO_RESPONSE,
  unitResourceId: MOCK_RESOURCE_ID,
  resourceId: null,
  createdByUserId: null,
  createdAt: null,
  ...overrides,
});
