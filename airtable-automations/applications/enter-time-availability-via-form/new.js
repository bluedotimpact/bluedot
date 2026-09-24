const { email, roundId, availability, timezone, comments } = input.config();

const table = base.getTable('tblXKnWoXK3R63F6D'); // Course registration
const ROUND = 'fldYaHSLqnvBXyjur';
const IS_DUPLICATE = 'fld1KQjHFGoDZKf94';
const IS_TEST_RECORD = 'fldjbuXz5VTVMyKBL';
const EMAIL = 'fld0g392xytratknm';
const COURSE = 'fldPkqPbeoIhERqSY';
const COURSE_ID = 'fldFTXtevzOc29Qte'; // [>] Course ID
const EXCLUDED_COURSE_ID = 'reclQRrjhDJSLazd4';

const query = await table.selectRecordsAsync({
  fields: [ROUND, IS_DUPLICATE, IS_TEST_RECORD, EMAIL, COURSE, COURSE_ID],
});

// A person can have several registrations in one round (e.g. quick-apply plus manual); update them all
const matches = query.records.filter((record) =>
  (record.getCellValue(ROUND) ?? []).some((round) => round.id === roundId)
  && !record.getCellValue(IS_DUPLICATE)
  && !record.getCellValue(IS_TEST_RECORD)
  && (record.getCellValue(EMAIL) ?? '').toLowerCase().includes((email ?? '').toLowerCase())
  && !(record.getCellValue(COURSE) ?? []).some((course) => course.id === EXCLUDED_COURSE_ID));

for (const record of matches) {
  await table.updateRecordsAsync([{
    id: record.id,
    fields: {
      fld9Y4WfeafUNMxMH: timezone, // Availability timezone
      fldZJdoS58GkGc0rY: new Date().toISOString().slice(0, 10), // Availability last updated
      fldur7dw7JEiAQNFK: comments, // Availability comments
      fldFpLDHyPPDvnJYg: availability, // Availability intervals (UTC)
    },
  }]);
}

output.set('matchedCount', matches.length);
output.set('updatedRecordIds', matches.map((record) => record.id));
// The webhook sender reads courseId[0]; matches share a round, so they share a course
output.set('courseId', matches.length > 0 ? (matches[0].getCellValue(COURSE_ID) ?? []) : []);
