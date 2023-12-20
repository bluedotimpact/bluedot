import { Kysely, sql } from 'kysely';

export async function v00001init(db: Kysely<unknown>): Promise<void> {
  await db.schema
    .createTable('Country')
    .addColumn('countryId', 'text', (col) => col.primaryKey())
    .addColumn('Name', 'text')
    .execute();

  await db.schema
    .createTable('State')
    .addColumn('stateId', 'text', (col) => col.primaryKey())
    .addColumn('Name', 'text')
    .addColumn('Abbreviation', 'text')
    .addColumn('Country', 'text')
    .addForeignKeyConstraint('Country', ['Country'], 'Country', ['countryId'])
    .execute();

  await db.schema
    .createTable('City')
    .addColumn('cityId', 'text', (col) => col.primaryKey())
    .addColumn('Display name', 'text')
    .addColumn('State', 'text')
    .addForeignKeyConstraint('State', ['State'], 'State', ['stateId'])
    .execute();

  await db.schema
    .createTable('People')
    .addColumn('personId', 'text', (col) => col.primaryKey())
    .addColumn('Name', 'text')
    .addColumn('email', 'text')
    .addColumn('availability-utc', 'text')
    .addColumn('[?] Cohort onboarding email sent', 'boolean')
    .addColumn('Role', 'text')
    .addColumn('[h] Cohort classes (participant)', 'text')
    .addColumn('[h] Time availability form', 'text')
    .addColumn('availability-comments', 'text')
    .addColumn('availability-timezone', 'text')
    .addColumn('Slack User ID', 'text')
    .addColumn('First name', 'text')
    .addColumn('Proposed persona', 'text')
    .addColumn('Iteration assignment', 'text')
    .addColumn('Last name', 'text')
    .addColumn('number Cohorts to Facilitate', 'integer')
    .addColumn('Cohort full overlap', 'text')
    .addColumn('Cohort partial overlap', 'text')
    .addColumn('[h] [Connect] LinkedIn', 'text')
    .addColumn('[h] [Connect] Organisation', 'text')
    .addColumn('[h] [Connect] Other credentials', 'text')
    .addColumn('[h] [Connect] Profile picture', 'text')
    .addColumn('[h] [Connect] Preferred contact method', 'text')
    .addColumn('[h] [Connect] How others can help me', 'text')
    .addColumn('[h] [Connect] How I can help others', 'text')
    .addColumn('[h] [Connect] Anything else?', 'text')
    .addColumn('[h] [Connect] Bio', 'text')
    .addColumn('[h] [Connect] Areas of interest', sql`text[]`)
    .addColumn('[h] [Connect] Org type', sql`text[]`)
    .addColumn('[h] [Connect] Opt in', 'boolean')
    .addColumn('[h] [Connect] City', 'text')
    .addColumn('[h] [Connect] Role', 'text')
    .addColumn('[h] [Connect] Org type (Others)', 'text')
    .addColumn('[h] [Connect] Areas of interest (Other)', 'text')
    .addColumn('Remove Profile from Connect (Admin)', 'boolean')
    .addColumn('[h] [Connect] Career Level (Others)', 'text')
    .addColumn('Attended sessions', 'text')
    .addColumn('[?] Send inactive email', 'boolean')
    .addColumn('[?] Send Follow-up Course Hub Onboarding', 'boolean')
    .addForeignKeyConstraint('[h] [Connect] City', ['[h] [Connect] City'], 'City', ['cityId'])
    .execute();

  await db.schema
    .createTable('Course')
    .addColumn('courseId', 'text', (col) => col.primaryKey())
    .addColumn('Name', 'text', (col) => col.notNull())
    .addColumn('Course site', 'text')
    .addColumn('Course announcements', 'text')
    .execute();

  await db.schema
    .createTable('Iteration')
    .addColumn('iterationId', 'text', (col) => col.primaryKey())
    .addColumn('Name', 'text', (col) => col.notNull())
    .addColumn('Course', 'text', (col) => col.notNull())
    .addColumn('Slack workspace', 'text')
    .addColumn('Participant week 8 feedback form', 'text')
    .addColumn('Facilitator week 8 feedback form', 'text')
    .addColumn('Max participants per cohort', 'integer')
    .addColumn('Is active', 'boolean', (col) => col.notNull())
    .addColumn('Badge', 'text')
    .addColumn('Certification description', 'text')
    .addColumn('Earning criteria (certification)', 'text')
    .addColumn('Certification name', 'text')
    .addForeignKeyConstraint('Course', ['Course'], 'Course', ['courseId'])
    .execute();

  await db.schema
    .createTable('Persona')
    .addColumn('personaId', 'text', (col) => col.primaryKey())
    .addColumn('Career level', sql`text[]`)
    .addColumn('Profession', sql`text[]`)
    .addColumn('Field of study', sql`text[]`)
    .execute();

  await db.schema
    .createTable('personaJoinIteration')
    .addColumn('personaId', 'text')
    .addColumn('iterationId', 'text')
    .addForeignKeyConstraint('personaId', ['personaId'], 'Persona', ['personaId'])
    .addForeignKeyConstraint('iterationId', ['iterationId'], 'Iteration', ['iterationId'])
    .execute();

  await db.schema
    .createTable('Bucket')
    .addColumn('bucketId', 'text', (col) => col.primaryKey())
    .addColumn('Persona', 'text')
    .addColumn('People', 'text')
    .addColumn('Cohorts', 'text')
    .addColumn('Iteration', 'text')
    .addForeignKeyConstraint('People', ['People'], 'People', ['personId'])
    .addForeignKeyConstraint('Iteration', ['Iteration'], 'Iteration', ['iterationId'])
    .execute();

  await db.schema
    .createTable('Cohorts')
    .addColumn('cohortId', 'text', (col) => col.primaryKey())
    .addColumn('[h] Activity doc', 'text')
    .addColumn('Start Time (UTC+0)', 'timestamptz')
    .addColumn('[h] Slack Channel ID', 'text')
    .addColumn('Autonumber', 'text')
    .addColumn('[?] create expected attendance', 'boolean')
    .addColumn('Cohort sessions', 'text')
    .addColumn('Cohort disbanded', 'boolean')
    .addColumn('Facilitator', 'text')
    .addColumn('Participants', 'text')
    .addColumn('Cohort full overlap', 'text')
    .addColumn('Cohort partial overlap', 'text')
    .addColumn('Iteration (link) (from Facilitator)', 'text')
    .addColumn('End Time (UTC+0)', 'timestamptz')
    .addColumn('[*] Cohort number', 'integer')
    .addColumn('Is lead cohort', 'boolean')
    .addColumn('[h] Who can switch into this cohort', 'text')
    .addForeignKeyConstraint('Facilitator', ['Facilitator'], 'People', ['personId'])
    .addForeignKeyConstraint('Participants', ['Participants'], 'People', ['personId'])
    .addForeignKeyConstraint('Cohort full overlap', ['Cohort full overlap'], 'People', ['personId'])
    .addForeignKeyConstraint('Cohort partial overlap', ['Cohort partial overlap'], 'People', ['personId'])
    .addForeignKeyConstraint('Iteration (link) (from Facilitator)', ['Iteration (link) (from Facilitator)'], 'Iteration', ['iterationId'])
    .addForeignKeyConstraint('[h] Who can switch into this cohort', ['[h] Who can switch into this cohort'], 'Bucket', ['bucketId'])
    .execute();

  await db.schema
    .createTable('Classes')
    .addColumn('classId', 'text', (col) => col.primaryKey())
    .addColumn('Name', 'text')
    .addColumn("Don't create session", 'boolean')
    .addColumn('Course', 'text')
    .addColumn('Week', 'integer')
    .addColumn('Topic', 'text')
    .addColumn('Session duration (mins)', 'integer')
    .addForeignKeyConstraint('Course', ['Course'], 'Course', ['courseId'])
    .execute();

  await db.schema
    .createTable('Zoom accounts')
    .addColumn('zoomAccountId', 'text', (col) => col.primaryKey())
    .addColumn('Account name', 'text')
    .addColumn('Description', 'text')
    .addColumn('Usage', sql`text[]`)
    .addColumn('Meeting link', 'text')
    .addColumn('zoom-user-id', 'text')
    .addColumn('Host key', 'text')
    .addColumn('passcode', 'text')
    .addColumn('Is licensed', 'boolean')
    .execute();

  await db.schema
    .createTable('Cohort classes')
    .addColumn('cohortClassId', 'text', (col) => col.primaryKey())
    .addColumn('Class', 'text')
    .addColumn('Cohort', 'text')
    .addColumn('Facilitator', 'text')
    .addColumn('Participants (Expected)', 'text')
    .addColumn('Attendees', 'text')
    .addColumn('Start date/time', 'timestamptz')
    .addColumn('End date/time', 'timestamptz')
    .addColumn('GCal Event ID', 'text')
    .addColumn('Zoom account', 'text')
    .addColumn('[?] Follow-up attendance email sent', 'boolean')
    .addForeignKeyConstraint('Class', ['Class'], 'Classes', ['classId'])
    .addForeignKeyConstraint('Cohort', ['Cohort'], 'Cohorts', ['cohortId'])
    .addForeignKeyConstraint('Zoom account', ['Zoom account'], 'Zoom accounts', ['zoomAccountId'])
    .execute();

  await db.schema
    .createTable('Change session time')
    .addColumn('sessionTimeChangeId', 'text', (col) => col.primaryKey())
    .addColumn('email', 'text')
    .addColumn('Cohort', 'text')
    .addColumn('Updated Datetime', 'timestamptz')
    .addColumn('Anything else', 'text')
    .addColumn('Switch type', 'text')
    .addColumn('Cohort class', 'text')
    .addColumn('Status', 'text')
    .addForeignKeyConstraint('Cohort', ['Cohort'], 'Cohorts', ['cohortId'])
    .addForeignKeyConstraint('Cohort class', ['Cohort class'], 'Cohort classes', ['cohortClassId'])
    .execute();

  await db.schema
    .createTable('Cohort Switching')
    .addColumn('cohortSwitchId', 'text', (col) => col.primaryKey())
    .addColumn('Name', 'text')
    .addColumn('Participant', 'text')
    .addColumn('Request status', 'text')
    .addColumn('Old Cohort', 'text')
    .addColumn('New cohort', 'text')
    .addColumn('Switch type', 'text')
    .addColumn('Notes from participant', 'text')
    .addColumn('Class', 'text')
    .addColumn('New session', 'text')
    .addColumn('Old Session', 'text')
    .addColumn('Slack error', 'text')
    .addColumn('!Add to Slack', 'boolean')
    .addColumn('Manual request?', 'boolean')
    .addForeignKeyConstraint('Participant', ['Participant'], 'People', ['personId'])
    .addForeignKeyConstraint('Old Cohort', ['Old Cohort'], 'Cohorts', ['cohortId'])
    .addForeignKeyConstraint('New cohort', ['New cohort'], 'Cohorts', ['cohortId'])
    .addForeignKeyConstraint('Class', ['Class'], 'Classes', ['classId'])
    .addForeignKeyConstraint('New session', ['New session'], 'Cohort classes', ['cohortClassId'])
    .addForeignKeyConstraint('Old Session', ['Old Session'], 'Cohort classes', ['cohortClassId'])
    .execute();

  await db.schema
    .createTable('Event')
    .addColumn('eventId', 'text', (col) => col.primaryKey())
    .addColumn('Event Name', 'text')
    .addColumn('Start Date', 'timestamptz')
    .addColumn('End date', 'timestamptz')
    .addColumn('Type', 'text')
    .addColumn('Zoom accounts', 'text')
    .addColumn('Event Signup', 'text')
    .addColumn('Published Event URL', 'text')
    .addColumn('GCal Event ID', 'text')
    .addColumn('Override Meeting link', 'text')
    .addColumn('Event planning link', 'text')
    .addColumn('Description', 'text')
    .addForeignKeyConstraint('Zoom account', ['Zoom accounts'], 'Zoom accounts', ['zoomAccountId'])
    .execute();

  await db.schema
    .createTable('Event Signup')
    .addColumn('eventSignupId', 'text', (col) => col.primaryKey())
    .addColumn('Person', 'text')
    .addColumn('Event', 'text')
    .addColumn('Comments from attendee', 'text')
    .addColumn('[?] Invited to GCal event', 'boolean')
    .addColumn('[?] Reminder triggered', 'boolean')
    .addForeignKeyConstraint('Person', ['Person'], 'People', ['personId'])
    .addForeignKeyConstraint('Event', ['Event'], 'Event', ['eventId'])
    .execute();

  await db.schema
    .createTable('Event feedback')
    .addColumn('eventFeedbackId', 'text', (col) => col.primaryKey())
    .addColumn('Event', 'text')
    .addColumn('Name', 'text')
    .addColumn('Attendance', 'text')
    .addColumn('learning / 7', 'integer')
    .addColumn('Engaging / 7', 'integer')
    .addColumn('what liked?', 'text')
    .addColumn('what to change?', 'text')
    .addColumn('Further comments', 'text')
    .addForeignKeyConstraint('Event', ['Event'], 'Event', ['eventId'])
    .execute();

  await db.schema
    .createTable('Project submission')
    .addColumn('projectSubmissionId', 'text', (col) => col.primaryKey())
    .addColumn('Participant', 'text')
    .addColumn('Iteration', 'text')
    .addColumn('Project title', 'text')
    .addColumn('Attachment', 'text')
    .addColumn('Link', 'text')
    .addColumn('Anything else?', 'text')
    .addColumn('Course sharing', 'text')
    .addColumn('Course sharing - maybe', 'text')
    .addColumn('Public sharing', 'text')
    .addColumn('Public sharing maybe', 'text')
    .addColumn('Project support', 'text')
    .addColumn('Email', 'text')
    .addColumn('Initial evaluation', 'text')
    .addForeignKeyConstraint('Participant', ['Participant'], 'People', ['personId'])
    .addForeignKeyConstraint('Iteration', ['Iteration'], 'Iteration', ['iterationId'])
    .execute();

  await db.schema
    .createTable('Project Evaluation')
    .addColumn('projectEvaluationId', 'text', (col) => col.primaryKey())
    .addColumn('Notes', 'text')
    .addColumn('Evaluator', 'text')
    .addColumn('Is complete', 'boolean')
    .addColumn('Project', 'text')
    .addColumn('Metric 1', 'integer')
    .addColumn('Metric 2', 'integer')
    .addColumn('Metric 3', 'integer')
    .addForeignKeyConstraint('Project', ['Project'], 'Project submission', ['projectSubmissionId'])
    .execute();

  await db.schema
    .createTable('Course Hub Users')
    .addColumn('courseHubUserId', 'text', (col) => col.primaryKey())
    .addColumn('Email', 'text')
    .addColumn('Full name', 'text')
    .addColumn('Last seen', 'timestamptz')
    .addColumn('Person', 'text')
    .addForeignKeyConstraint('Person', ['Person'], 'People', ['personId'])
    .execute();

  await db.schema
    .createTable('Certification')
    .addColumn('certificationId', 'text', (col) => col.primaryKey())
    .addColumn('Iteration', 'text')
    .addColumn('Earner', 'text')
    .addColumn('Issued at', 'timestamptz')
    .addColumn('[>] Earning criteria', 'text')
    .addColumn('[>] Description', 'text')
    .addColumn('[?] Sent', 'boolean')
    .addForeignKeyConstraint('Iteration', ['Iteration'], 'Iteration', ['iterationId'])
    .addForeignKeyConstraint('Earner', ['Earner'], 'People', ['personId'])
    .execute();

  await db.schema
    .createTable('personJoinCohort')
    .addColumn('personId', 'text')
    .addColumn('cohortId', 'text')
    .addForeignKeyConstraint('personId', ['personId'], 'People', ['personId'])
    .addForeignKeyConstraint('cohortId', ['cohortId'], 'Cohorts', ['cohortId'])
    .execute();

  await db.schema
    .createTable('personJoinCohortClass')
    .addColumn('personId', 'text')
    .addColumn('cohortId', 'text')
    .addForeignKeyConstraint('personId', ['personId'], 'People', ['personId'])
    .addForeignKeyConstraint('cohortId', ['cohortId'], 'Cohorts', ['cohortId'])
    .execute();

  await db.schema
    .createTable('courseJoinEvent')
    .addColumn('courseId', 'text')
    .addColumn('eventId', 'text')
    .addForeignKeyConstraint('courseId', ['courseId'], 'Course', ['courseId'])
    .addForeignKeyConstraint('eventId', ['eventId'], 'Event', ['eventId'])
    .execute();

  await db.schema
    .createTable('cohortJoinPerson')
    .addColumn('cohortId', 'text')
    .addColumn('personId', 'text')
    .addForeignKeyConstraint('cohortId', ['cohortId'], 'Cohorts', ['cohortId'])
    .addForeignKeyConstraint('personId', ['personId'], 'People', ['personId'])
    .execute();

  await db.schema
    .createTable('cohortClassAttendee')
    .addColumn('cohortClassId', 'text')
    .addColumn('personId', 'text')
    .addColumn('role', 'text')
    .addColumn('attended', 'boolean')
    .addForeignKeyConstraint('cohortClassId', ['cohortClassId'], 'Cohort classes', ['cohortClassId'])
    .addForeignKeyConstraint('personId', ['personId'], 'People', ['personId'])
    .execute();

  await db.schema
    .createTable('University')
    .addColumn('universityId', 'text', (col) => col.primaryKey())
    .addColumn('Name', 'text')
    .addColumn('Country', 'text')
    .addColumn('Status', 'text')
    .addColumn('Is top 150 university', 'boolean')
    .addForeignKeyConstraint('Country', ['Country'], 'Country', ['countryId'])
    .execute();

  await db.schema
    .createTable('Application')
    .addColumn('applicationId', 'text', (col) => col.primaryKey())
    // core fields
    .addColumn('Applicant first name', 'text')
    .addColumn('Applicant last name', 'text')
    .addColumn('Created at', 'timestamp')
    .addColumn('Proposed persona', 'text')
    .addColumn('Email', 'text')
    .addColumn('Iteration', 'text')
    .addColumn('[a]LinkedIn', 'text')
    .addColumn('[a]Other profile link', 'text')
    .addColumn('[a]Universities', 'text')
    .addColumn('[a]Field of study select', 'text')
    .addColumn('[a]Subject/field other', 'text')
    .addColumn('[a]Profession select', 'text')
    .addColumn('[a]Profession other', 'text')
    .addColumn('[a]Organisation', 'text')
    .addColumn('[a]Job title', 'text')
    .addColumn('[a]Career level', 'text')
    .addColumn('[a]Career level - further details', 'text')
    .addColumn('[a]Career plans', 'text')
    .addColumn('[a]City [link]', 'text')
    .addColumn('[a]Interest confirmation', 'text')
    .addColumn('[a]Interest details', 'text')
    .addColumn('[a]Source', 'text')
    .addColumn('[a]Anything else', 'text')
    .addColumn('[a]Form feedback', 'text')
    .addColumn('data sharing consent', 'boolean')
    // diversity monitoring
    .addColumn('sensitive data consent', 'boolean')
    .addColumn('Age', 'integer')
    .addColumn('Date of Birth', 'date')
    .addColumn('Ethnic origin', 'text')
    .addColumn('Ethnic origin - details', 'text')
    .addColumn('Gender', 'text')
    .addColumn('Gender - details', 'text')
    // facilitation details
    .addColumn('Facilitating Experience', 'text')
    .addColumn('Number of cohorts to facilitate', 'integer')
    .addColumn('Previous facilitator application', 'text')
    .addColumn('Is review team', 'boolean')
    .addColumn('Is lead cohort', 'boolean') // maybe change to 'could be lead cohort'?
    // other links
    .addColumn('Bucket (temp)', 'text')
    .addColumn('Bucket (final)', 'text')
    // other details
    .addColumn('Is duplicate', 'boolean')
    .addColumn('Is evaluation calibration record', 'boolean')
    .addColumn('Tentative application decision', 'text')
    .addColumn('Final application decision', 'text')

    .addForeignKeyConstraint('Proposed persona', ['Proposed persona'], 'Persona', ['personaId'])
    .addForeignKeyConstraint('Iteration', ['Iteration'], 'Iteration', ['iterationId'])
    .addForeignKeyConstraint('Previous facilitator application', ['Previous facilitator application'], 'Application', ['applicationId'])
    .addForeignKeyConstraint('Bucket (temp)', ['Bucket (temp)'], 'Bucket', ['bucketId'])
    .addForeignKeyConstraint('Bucket (final)', ['Bucket (final)'], 'Bucket', ['bucketId'])
    .execute();

  await db.schema
    .createTable('Application question')
    .addColumn('applicationQuestionId', 'text', (col) => col.primaryKey())
    .addColumn('Question', 'text')
    .execute();

  await db.schema
    .createTable('Application question response')
    .addColumn('applicationQuestionResponseId', 'text', (col) => col.primaryKey())
    .addColumn('applicationId', 'text')
    .addColumn('applicationQuestionId', 'text')
    .addColumn('Response', 'text')
    .addForeignKeyConstraint('applicationId', ['applicationId'], 'Application', ['applicationId'])
    .addForeignKeyConstraint('applicationQuestionId', ['applicationQuestionId'], 'Application question', ['applicationQuestionId'])
    .execute();
}
