import bluedot from '@bluedot/eslint-config';

/** @type {import('typescript-eslint').ConfigArray} */
export default [
  ...bluedot,
  {
    // schema.ts is a single source-of-truth file for ~30+ pgAirtable table
    // definitions; it's expected to grow as tables are added. Keep the rule
    // enabled elsewhere in the package but raise the limit here so the signal
    // remains useful for other files.
    files: ['src/schema.ts'],
    rules: {
      'max-lines': ['warn', { max: 2500, skipComments: true }],
      // Airtable can return an empty value for any field, so new synced columns must be nullable.
      // These existing ones predate the rule; remove an entry once its column is made nullable.
      '@bluedot/custom/no-not-null-synced-column': ['error', {
        allow: [
          'course.slug',
          'course.shortDescription',
          'course.title',
          'course.units',
          'group_discussion.facilitators',
          'group_discussion.participantsExpected',
          'group_discussion.startDateTime',
          'group_discussion.group',
          'program.name',
          'chunk.chunkId',
          'chunk.unitId',
          'chunk.chunkTitle',
          'chunk.chunkOrder',
          'chunk.chunkType',
          'chunk.chunkContent',
          'unit.courseId',
          'unit.courseTitle',
          'unit.courseSlug',
          'unit.title',
          'unit.unitNumber',
          'unit.unitStatus',
          'course_registration.email',
          'self_serve_course_registration.courseId',
          'user.email',
          'user.name',
        ],
      }],
    },
  },
];
