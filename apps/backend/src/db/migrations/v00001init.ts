import { Kysely, sql } from 'kysely';

export async function v00001init(db: Kysely<unknown>): Promise<void> {
  await db.schema
    .createTable('Country')
    .addColumn('country_id', 'text', (col) => col.primaryKey())
    .addColumn('Name', 'text')
    .execute();

  await db.schema
    .createTable('State')
    .addColumn('state_id', 'text', (col) => col.primaryKey())
    .addColumn('Name', 'text')
    .addColumn('Abbreviation', 'text')
    .addColumn('Country', 'varchar')
    .addForeignKeyConstraint('Country', ['Country'], 'Country', ['country_id'])
    .execute();

  await db.schema
    .createTable('City')
    .addColumn('city_id', 'text', (col) => col.primaryKey())
    .addColumn('Display name', 'text')
    .addColumn('State', 'varchar')
    .addForeignKeyConstraint('State', ['State'], 'State', ['state_id'])
    .execute();

  await db.schema
    .createTable('People')
    .addColumn('person_id', 'text', (col) => col.primaryKey())
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
    .addForeignKeyConstraint('[h] [Connect] City', ['[h] [Connect] City'], 'City', ['city_id'])
    .execute();

  await db.schema
    .createTable('Courses')
    .addColumn('course_id', 'text', (col) => col.primaryKey())
    .addColumn('Name', 'text')
    .addColumn('Course site', 'text')
    .addColumn('Course announcements', 'text')
    .execute();

  await db.schema
    .createTable('Iterations')
    .addColumn('iteration_id', 'text', (col) => col.primaryKey())
    .addColumn('Name', 'text')
    .addColumn('Course', 'text')
    .addColumn('Events', 'text')
    .addColumn('Slack workspace', 'text')
    .addColumn('Participant week 8 feedback form', 'text')
    .addColumn('Facilitator week 8 feedback form', 'text')
    .addColumn('Max participants per cohort', 'integer')
    .addColumn('Course text', 'text')
    .addColumn('Is active', 'boolean')
    .addColumn('Badge', 'text')
    .addColumn('Certification description', 'text')
    .addColumn('Earning criteria (certification)', 'text')
    .addColumn('Certification name', 'text')
    .addForeignKeyConstraint('Course', ['Course'], 'Courses', ['course_id'])
    .execute();

  await db.schema
    .createTable('Buckets')
    .addColumn('bucket_id', 'text', (col) => col.primaryKey())
    .addColumn('Persona', 'text')
    .addColumn('People', 'text')
    .addColumn('Cohorts', 'text')
    .addColumn('Iteration', 'text')
    .addForeignKeyConstraint('People', ['People'], 'People', ['person_id'])
    .addForeignKeyConstraint('Iteration', ['Iteration'], 'Iterations', ['iteration_id'])
    .execute();

  await db.schema
    .createTable('Cohorts')
    .addColumn('cohort_id', 'text', (col) => col.primaryKey())
    .addColumn('[h] Activity doc', 'text')
    .addColumn('Start Time (UTC+0)', 'timestamp')
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
    .addColumn('End Time (UTC+0)', 'timestamp')
    .addColumn('[*] Cohort number', 'integer')
    .addColumn('Is lead cohort', 'boolean')
    .addColumn('[h] Who can switch into this cohort', 'text')
    .addForeignKeyConstraint('Facilitator', ['Facilitator'], 'People', ['person_id'])
    .addForeignKeyConstraint('Participants', ['Participants'], 'People', ['person_id'])
    .addForeignKeyConstraint('Cohort full overlap', ['Cohort full overlap'], 'People', ['person_id'])
    .addForeignKeyConstraint('Cohort partial overlap', ['Cohort partial overlap'], 'People', ['person_id'])
    .addForeignKeyConstraint('Iteration (link) (from Facilitator)', ['Iteration (link) (from Facilitator)'], 'Iterations', ['iteration_id'])
    .addForeignKeyConstraint('[h] Who can switch into this cohort', ['[h] Who can switch into this cohort'], 'Buckets', ['bucket_id'])
    .execute();

  await db.schema
    .createTable('Classes')
    .addColumn('class_id', 'text', (col) => col.primaryKey())
    .addColumn('Course - Class', 'text')
    .addColumn("Don't create session", 'boolean')
    .addColumn('Course text', 'text')
    .addColumn('Course', 'text')
    .addColumn('Week', 'integer')
    .addColumn('Topic', 'text')
    .addColumn('Session duration (mins)', 'integer')
    .addForeignKeyConstraint('Course', ['Course'], 'Courses', ['course_id'])
    .execute();

  await db.schema
    .createTable('Zoom accounts')
    .addColumn('zoom_account_id', 'text', (col) => col.primaryKey())
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
    .addColumn('cohort_class_id', 'text', (col) => col.primaryKey())
    .addColumn('Class', 'text')
    .addColumn('Cohort', 'text')
    .addColumn('Facilitator', 'text')
    .addColumn('Participants (Expected)', 'text')
    .addColumn('Attendees', 'text')
    .addColumn('Start date/time', 'timestamp')
    .addColumn('End date/time', 'timestamp')
    .addColumn('GCal Event ID', 'text')
    .addColumn('Zoom account', 'text')
    .addColumn('[?] Follow-up attendance email sent', 'boolean')
    .addForeignKeyConstraint('Class', ['Class'], 'Classes', ['class_id'])
    .addForeignKeyConstraint('Cohort', ['Cohort'], 'Cohorts', ['cohort_id'])
    .addForeignKeyConstraint('Zoom account', ['Zoom account'], 'Zoom accounts', ['zoom_account_id'])
    .execute();

  await db.schema
    .createTable('Change session time')
    .addColumn('session_time_change_id', 'text', (col) => col.primaryKey())
    .addColumn('email', 'text')
    .addColumn('Cohort', 'text')
    .addColumn('Updated Datetime', 'timestamp')
    .addColumn('Anything else', 'text')
    .addColumn('Switch type', 'text')
    .addColumn('Cohort class', 'text')
    .addColumn('Status', 'text')
    .addForeignKeyConstraint('Cohort', ['Cohort'], 'Cohorts', ['cohort_id'])
    .addForeignKeyConstraint('Cohort class', ['Cohort class'], 'Cohort classes', ['cohort_class_id'])
    .execute();

  await db.schema
    .createTable('Cohort Switching')
    .addColumn('cohort_switch_id', 'text', (col) => col.primaryKey())
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
    .addForeignKeyConstraint('Participant', ['Participant'], 'People', ['person_id'])
    .addForeignKeyConstraint('Old Cohort', ['Old Cohort'], 'Cohorts', ['cohort_id'])
    .addForeignKeyConstraint('New cohort', ['New cohort'], 'Cohorts', ['cohort_id'])
    .addForeignKeyConstraint('Class', ['Class'], 'Classes', ['class_id'])
    .addForeignKeyConstraint('New session', ['New session'], 'Cohort classes', ['cohort_class_id'])
    .addForeignKeyConstraint('Old Session', ['Old Session'], 'Cohort classes', ['cohort_class_id'])
    .execute();

  await db.schema
    .createTable('Event')
    .addColumn('event_id', 'text', (col) => col.primaryKey())
    .addColumn('Event Name', 'text')
    .addColumn('Start Date', 'timestamp')
    .addColumn('End date', 'timestamp')
    .addColumn('Type', 'text')
    .addColumn('Zoom accounts', 'text')
    .addColumn('Event Signup', 'text')
    .addColumn('Published Event URL', 'text')
    .addColumn('GCal Event ID', 'text')
    .addColumn('Override Meeting link', 'text')
    .addColumn('Event planning link', 'text')
    .addColumn('Description', 'text')
    .addForeignKeyConstraint('Zoom account', ['Zoom accounts'], 'Zoom accounts', ['zoom_account_id'])
    .execute();

  await db.schema
    .createTable('Event Signup')
    .addColumn('event_signup_id', 'text', (col) => col.primaryKey())
    .addColumn('Person', 'text')
    .addColumn('Event', 'text')
    .addColumn('Comments from attendee', 'text')
    .addColumn('[?] Invited to GCal event', 'boolean')
    .addColumn('[?] Reminder triggered', 'boolean')
    .addForeignKeyConstraint('Person', ['Person'], 'People', ['person_id'])
    .addForeignKeyConstraint('Event', ['Event'], 'Event', ['event_id'])
    .execute();

  await db.schema
    .createTable('Event feedback')
    .addColumn('event_feedback_id', 'text', (col) => col.primaryKey())
    .addColumn('Event', 'text')
    .addColumn('Name', 'text')
    .addColumn('Attendance', 'text')
    .addColumn('learning / 7', 'integer')
    .addColumn('Engaging / 7', 'integer')
    .addColumn('what liked?', 'text')
    .addColumn('what to change?', 'text')
    .addColumn('Further comments', 'text')
    .addForeignKeyConstraint('Event', ['Event'], 'Event', ['event_id'])
    .execute();

  await db.schema
    .createTable('Project submission')
    .addColumn('project_submission_id', 'text', (col) => col.primaryKey())
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
    .addForeignKeyConstraint('Participant', ['Participant'], 'People', ['person_id'])
    .addForeignKeyConstraint('Iteration', ['Iteration'], 'Iterations', ['iteration_id'])
    .execute();

  await db.schema
    .createTable('Project Evaluation')
    .addColumn('project_evaluation_id', 'text', (col) => col.primaryKey())
    .addColumn('Notes', 'text')
    .addColumn('Evaluator', 'text')
    .addColumn('Is complete', 'boolean')
    .addColumn('Project', 'text')
    .addColumn('Metric 1', 'integer')
    .addColumn('Metric 2', 'integer')
    .addColumn('Metric 3', 'integer')
    .addForeignKeyConstraint('Project', ['Project'], 'Project submission', ['project_submission_id'])
    .execute();

  await db.schema
    .createTable('Course Hub Users')
    .addColumn('course_hub_user_id', 'text', (col) => col.primaryKey())
    .addColumn('Email', 'text')
    .addColumn('Full name', 'text')
    .addColumn('Last seen', 'timestamp')
    .addColumn('Person', 'text')
    .addForeignKeyConstraint('Person', ['Person'], 'People', ['person_id'])
    .execute();

  await db.schema
    .createTable('Certification')
    .addColumn('certification_id', 'text', (col) => col.primaryKey())
    .addColumn('Iteration', 'text')
    .addColumn('Earner', 'text')
    .addColumn('Issued on', 'timestamp')
    .addColumn('[>] Earning criteria', 'text')
    .addColumn('[>] Description', 'text')
    .addColumn('[?] Sent', 'boolean')
    .addForeignKeyConstraint('Iteration', ['Iteration'], 'Iterations', ['iteration_id'])
    .addForeignKeyConstraint('Earner', ['Earner'], 'People', ['person_id'])
    .execute();

  await db.schema
    .createTable('person_join_cohort')
    .addColumn('person_id', 'text')
    .addColumn('cohort_id', 'text')
    .addForeignKeyConstraint('person_id', ['person_id'], 'People', ['person_id'])
    .addForeignKeyConstraint('cohort_id', ['cohort_id'], 'Cohorts', ['cohort_id'])
    .execute();

  await db.schema
    .createTable('person_join_cohort_class')
    .addColumn('person_id', 'text')
    .addColumn('cohort_id', 'text')
    .addForeignKeyConstraint('person_id', ['person_id'], 'People', ['person_id'])
    .addForeignKeyConstraint('cohort_id', ['cohort_id'], 'Cohorts', ['cohort_id'])
    .execute();

  await db.schema
    .createTable('course_join_event')
    .addColumn('course_id', 'text')
    .addColumn('event_id', 'text')
    .addForeignKeyConstraint('course_id', ['course_id'], 'Courses', ['course_id'])
    .addForeignKeyConstraint('event_id', ['event_id'], 'Event', ['event_id'])
    .execute();

  await db.schema
    .createTable('cohort_join_person')
    .addColumn('cohort_id', 'text')
    .addColumn('person_id', 'text')
    .addForeignKeyConstraint('cohort_id', ['cohort_id'], 'Cohorts', ['cohort_id'])
    .addForeignKeyConstraint('person_id', ['person_id'], 'People', ['person_id'])
    .execute();

  await db.schema
    .createTable('cohort_class_attendee')
    .addColumn('cohort_class_id', 'text')
    .addColumn('person_id', 'text')
    .addColumn('role', 'text')
    .addColumn('attended', 'boolean')
    .addForeignKeyConstraint('cohort_class_id', ['cohort_class_id'], 'Cohort classes', ['cohort_class_id'])
    .addForeignKeyConstraint('person_id', ['person_id'], 'People', ['person_id'])
    .execute();
}
