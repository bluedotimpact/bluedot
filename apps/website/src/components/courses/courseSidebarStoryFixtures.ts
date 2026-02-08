import type { Unit } from '@bluedot/db';
import type { RequestHandler } from 'msw';
import { trpcStorybookMsw } from '../../__tests__/trpcMswSetup.browser';
import type { BasicChunk } from '../../pages/courses/[courseSlug]/[unitNumber]/[[...chunkNumber]]';

export const mockUnits: Unit[] = [
  {
    id: 'unit-1',
    unitNumber: '1',
    title: 'Introduction to AI Safety',
    courseId: 'course-1',
    courseSlug: 'ai-safety',
    courseTitle: 'AI Safety Fundamentals',
    chunks: ['chunk-1', 'chunk-2'],
    unitStatus: 'Active',
  },
  {
    id: 'unit-2',
    unitNumber: '2',
    title: 'Technical Alignment',
    courseId: 'course-1',
    courseSlug: 'ai-safety',
    courseTitle: 'AI Safety Fundamentals',
    chunks: ['chunk-3', 'chunk-4'],
    unitStatus: 'Active',
  },
] as Unit[];

export const mockChunks: Record<string, BasicChunk[]> = {
  'unit-1': [
    {
      id: 'chunk-1',
      chunkTitle: 'Getting Started',
      chunkOrder: '1',
      estimatedTime: 45,
    },
    {
      id: 'chunk-2',
      chunkTitle: 'Core Concepts',
      chunkOrder: '2',
      estimatedTime: 75,
    },
  ],
  'unit-2': [
    {
      id: 'chunk-3',
      chunkTitle: 'Alignment Techniques',
      chunkOrder: '1',
      estimatedTime: 90,
    },
    {
      id: 'chunk-4',
      chunkTitle: 'Case Studies',
      chunkOrder: '2',
      estimatedTime: 90,
    },
  ],
};

// Mock progress data for stories
const totalCount = 12; // 8 resources + 4 exercises

export const defaultProgressHandlers: RequestHandler[] = [
  trpcStorybookMsw.courses.getCourseProgress.query(() => ({
    courseProgress: {
      totalCount,
      completedCount: 0,
      percentage: 0,
    },
    chunkProgressByUnitNumber: {
      1: [
        { totalCount: 4, completedCount: 0, allCompleted: false }, // chunk-1
        { totalCount: 3, completedCount: 0, allCompleted: false }, // chunk-2
      ],
      2: [
        { totalCount: 3, completedCount: 0, allCompleted: false }, // chunk-3
        { totalCount: 2, completedCount: 0, allCompleted: false }, // chunk-4
      ],
    },
  })),
];

export const someProgressHandlers: RequestHandler[] = [
  trpcStorybookMsw.courses.getCourseProgress.query(() => ({
    courseProgress: {
      totalCount,
      completedCount: 3,
      percentage: 25,
    },
    chunkProgressByUnitNumber: {
      1: [
        { totalCount: 4, completedCount: 3, allCompleted: false }, // chunk-1: res-1, res-2, ex-1 completed
        { totalCount: 3, completedCount: 0, allCompleted: false }, // chunk-2
      ],
      2: [
        { totalCount: 3, completedCount: 0, allCompleted: false }, // chunk-3
        { totalCount: 2, completedCount: 0, allCompleted: false }, // chunk-4
      ],
    },
  })),
];

export const allCompletedHandlers: RequestHandler[] = [
  trpcStorybookMsw.courses.getCourseProgress.query(() => ({
    courseProgress: {
      totalCount,
      completedCount: totalCount,
      percentage: 100,
    },
    chunkProgressByUnitNumber: {
      1: [
        { totalCount: 4, completedCount: 4, allCompleted: true }, // chunk-1
        { totalCount: 3, completedCount: 3, allCompleted: true }, // chunk-2
      ],
      2: [
        { totalCount: 3, completedCount: 3, allCompleted: true }, // chunk-3
        { totalCount: 2, completedCount: 1, allCompleted: true }, // chunk-4
      ],
    },
  })),
];
