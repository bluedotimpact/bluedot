import {
  type FormSubmissionCopyConfig, type FormSubmissionCopyFormField, loadCityNames, loadRoundNames,
} from './formSubmissionCopy';

const EMAIL = 'fld0g392xytratknm'; // Email

// Course registration in the Applications base. Every field on the record is read, so the deny list names the fields no form sends.
const COURSE_REGISTRATION_FORM: Omit<FormSubmissionCopyConfig, 'fieldAllowList'> = {
  table: { baseId: 'appnJbsG1eWbAdEvf', tableId: 'tblXKnWoXK3R63F6D' },
  recipientEmailField: EMAIL,
  fieldDenyListPatterns: [/^\[[*>?!]\]/],
  fieldDenyList: [
    'fldqKvvCeH0Kv35Wy', // Name
    'fldkg8ni5sRQ2FrKs', // Lead group/Review team/Teaching Fellow
    'fldjbuXz5VTVMyKBL', // Is test record
    'fldWVKY5EFAGSRcDT', // Decision
    'fldpT6N3jpqE0DeXX', // Anything else
    'fld52Y2AyWV8tECDy', // Role
    'fldhz4pz8gE0SAeNQ', // Created at (manual override)
    'fldaEk9K3m25Hs4Ga', // Drop Out / Defer
    'fldrgRahkWJn0Ar9R', // Previous facilitator
    'fld1KQjHFGoDZKf94', // Is duplicate
    'fldQ9PM3ejhilPFc6', // Source
    'fldrdUx8Q5PL53p4Y', // Campaign
    'fldr6cODIzoMdqmQ8', // Content
    'fldyZHM0qpgIkzo8c', // Created at
    'fldygOncl6PuOxQ28', // Is dropped out?
    'fld1DhCg6sdVTvo5i', // Teaching Fellow status
    'fldWzH0qNrAnI4TfG',
    'fldvYGSC0piGCxZVU',
    'fldOm6fJcqhq78M71',
    'fldeu4mItnY4tbnEZ',
    'fldFpLDHyPPDvnJYg', // Availability intervals (UTC)
    'fldur7dw7JEiAQNFK', // Availability comments
    'fld9Y4WfeafUNMxMH', // Availability timezone
    'fldZJdoS58GkGc0rY', // Availability last updated
    'fldpYmO0PaZxRFL5v', // Previous participant
    'fldekLcszYyd6VHb6',
    'fldyVcp78eIfqmai3', // User
    'fldQJyVjaiQzsVGD9', // Certificate created at
    'fld9hQE0EvdKRsp9k', // Certificate ID
    'fldpGoGWXtrznCPgi', // Certificate Link
    'fldK4e103qGfgbaGM', // Exercise response
    'fld2W2olE7mRRALMC', // ID
    'fldaAE5O1KsYb9f9c',
    'fld5huxBWvakXL7aK',
    'fldQjiMmDvwrJ6NrL', // Prefill record ID
    'fld5G27T1IMkkkoGN', // PostHog Session ID
    'fldd0jwAHFgywIt7N', // PostHog Distinct ID
    'fldRXdZQ0rnuVOcl7',
    'fldvPBmzJwBwdMuoM',
    'fldKgZweXcilRhvwo',
    'fldL5K79cFu6Bju2N',
    'fldcZWFBKtjOqX8A2',
    'fldXdgD6to4gCs4Lj',
    'fldYcDjhWaLDL2RyT',
    'fldEPZ0UfYoypB1mp',
    'fldtkropu9GZ7QLjr',
    'fld7qoZTSBPjY3gzl',
    'fldTIEB3s6m6pCJTV', // Decision edited at
    'fldaUhr1WKxaMGoBK', // Accepted at
    'flddiGliYfrwwpio7',
    'fldI2QaCLAJDw4VzM', // Rejected at
    'fldaNQYypNEFnZwHy', // Withdrawn at
    'fldyOQHm5dKPjPa80', // 1-1 invite date
    'fldwhiPOBOHDUKDDA', // 1-1 invite source
    'fld6FgikMTOlrzfz3',
    'fld1kVF4qaqwAMTmp',
    'fldOL7zFUYdkgO3Qa',
    'fldL4vvWGZIKLZZZ2',
    'fldBBWnuGbLdaXIPJ',
    'fldZaWV0sPDYuC30A',
    'fldEvXcA5sgXkpUgR',
    'fldls2Mc8AFVwDjvZ',
    'fldqFiVDHPOHk6lgM',
    'fldtQvLK99qcyjWEN',
    'fldxbkg22ao2wNITM',
    'fld7D3TIFmDKoySMF',
    'fldDAFph92Zf5mtvu',
    'fldCsQsQ3qXcaGyum',
    'fldWaR5kYBGvbE5en',
    'fldVShqpkNoyCUaQu',
    'fldC3ehuPoqwwjHMa',
    'fldcfE6pRU5ywT7C7',
  ],
};
const COURSE = { field: 'fldkEQ0zBUhqpIuJn', label: 'Course you\'re applying for', required: true }; // Course (single select)
const ROLE = { field: 'fld7fzQNFhb7Oyy90', label: 'Are you applying as a participant or facilitator?' }; // [a] Role
const ROUND = {
  field: 'fldYaHSLqnvBXyjur', label: 'Round', required: true, load: loadRoundNames, // Round
};
const ABOUT_YOU: FormSubmissionCopyFormField[] = [
  { field: 'fldIhZ4wc5t1Yabgz', label: 'First name', required: true }, // First name
  { field: 'fldHa6GR5aBsOBtkz', label: 'Last name', required: true }, // Last name
  { field: EMAIL, label: 'Email address', required: true },
  { field: 'fldgtfQaYJbUHvH3h', label: 'Profile URL' }, // Profile URL
  { field: 'fldq4vFSZQ4U5KelW', label: 'Link to any other profile' }, // Other profile URL
  { field: 'fldcemZdf3ZvDCehu', label: 'What is the closest match to your field(s) of study?' }, // Field of study
  { field: 'fldfWHOHD2Xw9N0ei', label: 'What is your field of study?' }, // Field of study (other)
  { field: 'fld0J5SuqA1MZSLU1', label: 'What is your current career stage?' }, // Career level
  { field: 'fldxhpwvIe2ie5j5F', label: 'Please briefly describe your current career stage' }, // Career level (other)
  { field: 'fldBKgqEQ2xBVZUlH', label: 'What organisation do you work at?' }, // Organisation
  { field: 'fldn2VmCwMP7XFSTn', label: 'What\'s your job title?' }, // Job title
  { field: 'fldRls5y4N4WIJ8tJ', label: 'Which of the following most closely describes your profession?' }, // Profession
  { field: 'fld48LXEpNB1SHOe2', label: 'Please briefly describe your profession.' }, // Profession (other)
  { field: 'fldZHjHXBvzY0oxr5', label: 'Where will you be based during this course?', load: loadCityNames }, // City
];
const US_POLITICAL_OFFICE = { field: 'fld7ChYD1WWBtdUit', label: 'If you were to work in US policy, what types of political office(s) would you be interested in working in?' }; // US Political Office
const PATH_TO_IMPACT = 'fldrKSzvW4meHeINi'; // Path to impact
const EXPERIENCE = 'fldJAKX8Lcl5Qeq1K'; // Experience
const SKILLS = 'fldqNrt2OdsIsulMD'; // Skills
const IMPRESSIVE_PROJECT = 'fldL3qU8ILGYiF4ea'; // Impressive project
const REASONING = 'fldPp0Mmpj6j25dg6'; // Reasoning
const MOTIVATION_TO_FACILITATE = 'fldLoKwG59WWf8twB'; // Motivation to facilitate
const FACILITATION_EXPERIENCE = 'fld7qr6IyUtC4ILkT'; // Facilitation experience
const GROUPS_TO_FACILITATE = 'fldqirnvpnxjSzGPY'; // # Groups to Facilitate
const FACILITATING: FormSubmissionCopyFormField[] = [
  { field: MOTIVATION_TO_FACILITATE, label: 'Why do you want to facilitate this course?' },
  { field: FACILITATION_EXPERIENCE, label: 'What\'s your previous facilitation or teaching experience?' },
  { field: GROUPS_TO_FACILITATE, label: 'How many cohorts would you like to facilitate?' },
];
const SOURCE = { field: 'flduEoJRp6uvz74xo', label: 'Where did you hear about this course?' }; // [a] Source
const PERSON_THEY_RECOMMEND = 'fldBymkWowNHJCGKq'; // Person they recommend
const RECOMMENDATION = { field: PERSON_THEY_RECOMMEND, label: 'Who is the most exceptional person you would nominate for this course?' };
const MENTION_NAME = { field: 'fldPBKXh1teQgTrOH', label: 'Can we mention your name if we reach out to them?' }; // Mention name in recommendation
const FORM_FEEDBACK = { field: 'fldRGBrjMUHyUXRJr', label: 'Do you have any feedback on this application form?' }; // Form feedback
const DATA_SHARING_CONSENT = 'fldCqp2Yp3xD9VGmK'; // Data sharing consent
const DATA_SHARING = { field: DATA_SHARING_CONSENT, label: 'Can we share your data with third-party AI safety organisations?' };
const DIVERSITY: FormSubmissionCopyFormField[] = [
  { field: 'fldgFhKLNhaFPXVKF', label: 'Diversity data consent' }, // Sensitive data consent
  { field: 'fld43elHu306SVJiL', label: 'Gender' }, // Gender
  { field: 'fldCXuXo6d0rFrkoa', label: 'Gender description' }, // Gender - details
  { field: 'fldBrqUfs4zJVvRRg', label: 'Ethnic origin' }, // Ethnic origin
  { field: 'fld2UraWE0vxxnIGY', label: 'Ethnic origin description' }, // Ethnic origin - details
  { field: 'fldlvFcXtNYdhaWLW', label: 'Age (in years)' }, // Age
];

// Keyed by the form query param on each form's webhook URL
const FORM_SUBMISSION_COPY_CONFIGS: Record<string, FormSubmissionCopyConfig> = {
  'AGI Strategy Course application': {
    ...COURSE_REGISTRATION_FORM,
    fieldAllowList: [
      COURSE,
      ROLE,
      ROUND,
      ...ABOUT_YOU,
      { field: 'fldbk4IiZ1UzY76mA', label: 'How many hours have you spent engaging with AI safety content so far?' }, // Engagement hours with AI safety.
      US_POLITICAL_OFFICE,
      { field: PATH_TO_IMPACT, label: 'What will you do differently after this course, and why can\'t you do it now?' },
      { field: EXPERIENCE, label: 'How have you engaged with AI safety so far?' },
      { field: SKILLS, label: 'What skills will you contribute?' },
      { field: IMPRESSIVE_PROJECT, label: 'Tell us about something you\'ve built, shipped, or made happen.' },
      { field: REASONING, label: 'What\'s the hardest tradeoff or tension you see in AI safety, and how do you think about it?' },
      ...FACILITATING,
      SOURCE,
      RECOMMENDATION,
      MENTION_NAME,
      FORM_FEEDBACK,
      DATA_SHARING,
      ...DIVERSITY,
    ],
  },
  'Biosecurity Course application': {
    ...COURSE_REGISTRATION_FORM,
    fieldAllowList: [
      COURSE,
      ROLE,
      ROUND,
      ...ABOUT_YOU,
      US_POLITICAL_OFFICE,
      { field: PATH_TO_IMPACT, label: 'Imagine you\'re at the end of the biosecurity course, and it\'s been a wild success for you. How is your life different?' },
      { field: EXPERIENCE, label: 'How have you engaged with the biosecurity field so far?' },
      { field: SKILLS, label: 'What skills will you contribute?' },
      { field: IMPRESSIVE_PROJECT, label: 'Tell us about one achievement you\'re most proud of.' },
      ...FACILITATING,
      SOURCE,
      { field: PERSON_THEY_RECOMMEND, label: 'Who is the most exceptional person you would refer for this course?' },
      MENTION_NAME,
      FORM_FEEDBACK,
      { field: DATA_SHARING_CONSENT, label: 'Can we share your data with third-party biosecurity and AI safety organisations?' },
      ...DIVERSITY,
    ],
  },
  'Frontier AI Governance Course application': {
    ...COURSE_REGISTRATION_FORM,
    fieldAllowList: [
      COURSE,
      ROLE,
      ROUND,
      ...ABOUT_YOU,
      US_POLITICAL_OFFICE,
      { field: PATH_TO_IMPACT, label: 'What will you do differently after this course, and why can\'t you do it now?' },
      { field: EXPERIENCE, label: 'How have you engaged with AI governance so far?' },
      { field: SKILLS, label: 'What skills have you developed that could be used to advance AI governance?' },
      { field: IMPRESSIVE_PROJECT, label: 'Tell us about something you\'ve made happen.' },
      { field: REASONING, label: 'What\'s the hardest tradeoff or tension you see in AI governance, and how do you think about it?' },
      ...FACILITATING,
      SOURCE,
      RECOMMENDATION,
      MENTION_NAME,
      FORM_FEEDBACK,
      DATA_SHARING,
      ...DIVERSITY,
    ],
  },
  'Technical AI Safety Course application': {
    ...COURSE_REGISTRATION_FORM,
    fieldAllowList: [
      COURSE,
      ROLE,
      ROUND,
      { field: 'fldooZSRRtcLSKKvo', label: 'Open to being placed in the AGI Strategy course instead if recommended' }, // [TAIS] Allow to move to AGISC
      ...ABOUT_YOU,
      US_POLITICAL_OFFICE,
      { field: PATH_TO_IMPACT, label: 'How do you expect this course will help you contribute to making AI go well?' },
      { field: EXPERIENCE, label: 'How have you engaged with the AI safety field so far?' },
      { field: SKILLS, label: 'What skills have you developed that could be used to make AI go well?' },
      { field: IMPRESSIVE_PROJECT, label: 'Tell us about one achievement you\'re most proud of.' },
      ...FACILITATING,
      SOURCE,
      RECOMMENDATION,
      MENTION_NAME,
      FORM_FEEDBACK,
      DATA_SHARING,
      ...DIVERSITY,
    ],
  },
  'Technical AI Safety Project Course application': {
    ...COURSE_REGISTRATION_FORM,
    fieldAllowList: [
      COURSE,
      ROLE,
      ROUND,
      { field: 'fldbaq4Nzv3ECsW9h', label: 'Open to being placed in the Technical AI Safety course instead if recommended' }, // [TAIS] Allow to move to TAIS
      ...ABOUT_YOU,
      { field: SKILLS, label: 'What technical skills do you have to completing an AI safety research or engineering project?' },
      { field: PATH_TO_IMPACT, label: 'How do you expect this project will help you contribute to making AI go well?' },
      { field: EXPERIENCE, label: 'How have you engaged with the AI safety field so far?' },
      { field: IMPRESSIVE_PROJECT, label: 'Tell us about one achievement you\'re most proud of.' },
      { field: MOTIVATION_TO_FACILITATE, label: 'Why do you want to be project coach?' },
      { field: FACILITATION_EXPERIENCE, label: 'What\'s your previous coaching experience?' },
      { field: GROUPS_TO_FACILITATE, label: 'How many groups would you like to coach?' },
      SOURCE,
      RECOMMENDATION,
      MENTION_NAME,
      FORM_FEEDBACK,
      DATA_SHARING,
      ...DIVERSITY,
    ],
  },
};

export function getFormSubmissionCopyConfig(form: string): FormSubmissionCopyConfig | undefined {
  return Object.hasOwn(FORM_SUBMISSION_COPY_CONFIGS, form) ? FORM_SUBMISSION_COPY_CONFIGS[form] : undefined;
}
