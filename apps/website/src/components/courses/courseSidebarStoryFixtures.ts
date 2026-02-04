/**
 * Shared fixtures for SideBar and MobileCourseModal stories.
 */
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
      chunkResources: ['res-1', 'res-2', 'res-3'],
      chunkExercises: ['ex-1'],
    },
    {
      id: 'chunk-2',
      chunkTitle: 'Core Concepts',
      chunkOrder: '2',
      estimatedTime: 75,
      chunkResources: ['res-4', 'res-5'],
      chunkExercises: ['ex-2', 'ex-3'],
    },
  ],
  'unit-2': [
    {
      id: 'chunk-3',
      chunkTitle: 'Alignment Techniques',
      chunkOrder: '1',
      estimatedTime: 90,
      chunkResources: ['res-6', 'res-7'],
      chunkExercises: ['ex-4'],
    },
    {
      id: 'chunk-4',
      chunkTitle: 'Case Studies',
      chunkOrder: '2',
      estimatedTime: 90,
      chunkResources: ['res-8'],
      chunkExercises: null,
    },
  ],
};

// All resources are "Core" and all exercises are "Active" for simplicity
export const allResourceIds = ['res-1', 'res-2', 'res-3', 'res-4', 'res-5', 'res-6', 'res-7', 'res-8'];
export const allExerciseIds = ['ex-1', 'ex-2', 'ex-3', 'ex-4'];

export const defaultProgressHandlers: RequestHandler[] = [
  trpcStorybookMsw.resources.getCoreResourceIds.query(() => allResourceIds),
  trpcStorybookMsw.exercises.getActiveExerciseIds.query(() => allExerciseIds),
  trpcStorybookMsw.resources.getResourceCompletions.query(() => []),
  trpcStorybookMsw.exercises.getExerciseCompletions.query(() => []),
];

export const makeResourceCompletion = (id: string, unitResourceId: string, autoNumberId: number) => ({
  id,
  unitResourceId,
  email: 'test@example.com',
  isCompleted: true,
  rating: null,
  feedback: null,
  resourceFeedback: 0 as const,
  autoNumberId,
});

export const someProgressHandlers: RequestHandler[] = [
  trpcStorybookMsw.resources.getCoreResourceIds.query(() => allResourceIds),
  trpcStorybookMsw.exercises.getActiveExerciseIds.query(() => allExerciseIds),
  trpcStorybookMsw.resources.getResourceCompletions.query(() => [
    makeResourceCompletion('rc-1', 'res-1', 1),
    makeResourceCompletion('rc-2', 'res-2', 2),
  ]),
  trpcStorybookMsw.exercises.getExerciseCompletions.query(() => [
    { exerciseId: 'ex-1', completed: true },
  ]),
];

export const allCompletedHandlers: RequestHandler[] = [
  trpcStorybookMsw.resources.getCoreResourceIds.query(() => allResourceIds),
  trpcStorybookMsw.exercises.getActiveExerciseIds.query(() => allExerciseIds),
  trpcStorybookMsw.resources.getResourceCompletions.query(() => [
    makeResourceCompletion('rc-1', 'res-1', 1),
    makeResourceCompletion('rc-2', 'res-2', 2),
    makeResourceCompletion('rc-3', 'res-3', 3),
  ]),
  trpcStorybookMsw.exercises.getExerciseCompletions.query(() => [
    { exerciseId: 'ex-1', completed: true },
  ]),
];
