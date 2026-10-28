import { applicationsRoundTable } from '@bluedot/db';
import { createHmac } from 'crypto';
import {
  afterEach, describe, expect, test, vi,
} from 'vitest';
import { setupTestDb, testDb } from '../../__tests__/dbTestUtils';
import { getFormSubmissionCopyConfig } from './formConfigs';
import {
  type FormSubmissionCopyConfig, FormSubmissionCopyConfigError, deriveFormSubmissionCopyToken, formatFormSubmissionCopyEmail, loadCityNames, resolveSubmission,
} from './formSubmissionCopy';

vi.mock('../api/env', () => ({
  default: {
    APP_NAME: 'test-app',
    ALERTS_SLACK_BOT_TOKEN: 'fake-token',
    ALERTS_SLACK_CHANNEL_ID: 'fake-channel',
    AIRTABLE_AUTOMATION_TOKEN: 'automation-secret',
    AIRTABLE_PERSONAL_ACCESS_TOKEN: 'fake-pat',
    VITEST: 'true',
  },
}));

setupTestDb();

afterEach(() => {
  vi.unstubAllGlobals();
});

const testForm: FormSubmissionCopyConfig = {
  table: { baseId: 'appTest', tableId: 'tblTest' },
  fieldDenyList: ['fldDecision'],
  fieldDenyListPatterns: [/^\[[*>]\]/],
  recipientEmailField: 'fldEmail',
  fieldAllowList: [
    { field: 'fldSkills', label: 'What skills will you contribute?' },
    { field: 'fldFirstName', label: 'First name', required: true },
    { field: 'fldEmail', label: 'Email address', required: true },
    { field: 'fldExperience', label: 'How have you engaged with AI safety so far?' },
    { field: 'fldShownFormula', label: 'Allowlisted formula' },
  ],
};

const testFieldNames = {
  fldSkills: 'Skills',
  fldFirstName: 'First name',
  fldEmail: 'Email',
  fldExperience: 'Experience',
  fldShownFormula: '[*] Shown formula',
  fldDecision: 'Decision',
  fldCountry: '[>] Country',
  fldRoundName: '[*] Round name',
  fldNew: 'New question',
};

// Real ids from the Course registration table, for the config-driven tests
const COURSE = 'fldkEQ0zBUhqpIuJn';
const ROUND = 'fldYaHSLqnvBXyjur';
const FIRST_NAME = 'fldIhZ4wc5t1Yabgz';
const LAST_NAME = 'fldHa6GR5aBsOBtkz';
const EMAIL = 'fld0g392xytratknm';

const baseFields = { fldFirstName: 'Ada', fldEmail: 'ada@example.com' };
const courseBaseFields = {
  [FIRST_NAME]: 'Ada', [LAST_NAME]: 'Lovelace', [EMAIL]: 'ada@example.com', [COURSE]: 'AGI Strategy', [ROUND]: ['recRound1'],
};

const resolve = (fields: Record<string, unknown>, formConfig = testForm, fieldNames: Record<string, string> = testFieldNames) => resolveSubmission({ formConfig, airtableRecordFields: fields, fieldNames });

const render = async (fields: Record<string, unknown>) => {
  const { answers } = await resolve({ ...baseFields, ...fields });
  return formatFormSubmissionCopyEmail({ formTitle: 'Test form', answers }).html;
};

describe('getFormSubmissionCopyConfig', () => {
  test('returns configs for the five course application forms', () => {
    for (const title of [
      'AGI Strategy Course application',
      'Biosecurity Course application',
      'Frontier AI Governance Course application',
      'Technical AI Safety Course application',
      'Technical AI Safety Project Course application',
    ]) {
      expect(getFormSubmissionCopyConfig(title)?.recipientEmailField).toBe(EMAIL);
    }
  });

  test('returns undefined for unknown titles, including object prototype keys', () => {
    expect(getFormSubmissionCopyConfig('Some other form')).toBeUndefined();
    expect(getFormSubmissionCopyConfig('constructor')).toBeUndefined();
  });
});

describe('deriveFormSubmissionCopyToken', () => {
  test('is the hex HMAC of a fixed message keyed by the automation token', () => {
    expect(deriveFormSubmissionCopyToken())
      .toBe(createHmac('sha256', 'automation-secret').update('form-submission-copy').digest('hex'));
  });
});

describe('resolveSubmission', () => {
  test('returns the email and answers in config order, not payload order', async () => {
    const { email, answers } = await resolve({ fldExperience: 'Reading group', fldEmail: ' ada@example.com ', fldFirstName: 'Ada' });
    expect(email).toBe('ada@example.com');
    expect(answers.map((a) => a.label)).toEqual(['First name', 'Email address', 'How have you engaged with AI safety so far?']);
  });

  test('omits blank optional fields', async () => {
    const { answers } = await resolve({ ...baseFields, fldSkills: '   ', fldExperience: [] });
    expect(answers.map((a) => a.label)).toEqual(['First name', 'Email address']);
  });

  test('reports blank required fields by name and id, and still returns the other answers', async () => {
    const { answers, blankRequiredFields } = await resolve({ fldEmail: 'ada@example.com' });
    expect(blankRequiredFields).toEqual([{ id: 'fldFirstName', name: 'First name' }]);
    expect(answers.map((a) => a.label)).toEqual(['Email address']);
  });

  test('throws a config error when the email is invalid', async () => {
    const formConfig = { ...testForm, fieldAllowList: [] };
    await expect(resolve({ fldEmail: 'not-an-email' }, formConfig)).rejects.toMatchObject({ field: 'fldEmail', kind: 'invalid-email' });
  });

  test('throws a config error for values that cannot be shown as text', async () => {
    await expect(resolve({ ...baseFields, fldSkills: { url: 'https://x' } })).rejects.toMatchObject({ field: 'fldSkills', kind: 'unrenderable' });
    await expect(resolve({ ...baseFields, fldSkills: [{ id: 'rec1' }] })).rejects.toBeInstanceOf(FormSubmissionCopyConfigError);
  });

  test('reports fields that are neither listed nor denied, with their names', async () => {
    const { unknownFields } = await resolve({
      ...baseFields, fldDecision: 'Accept', fldCountry: ['UK'], fldRoundName: 'R1', fldNew: 'x',
    });
    expect(unknownFields).toEqual([{ id: 'fldNew', name: 'New question' }]);
  });

  test('falls back to the id when a field name is not known', async () => {
    const { unknownFields } = await resolve({ ...baseFields, fldMystery: 'x' });
    expect(unknownFields).toEqual([{ id: 'fldMystery', name: 'fldMystery' }]);
  });

  test('renders allowlisted fields even when they match a deny pattern', async () => {
    const { answers, unknownFields } = await resolve({ ...baseFields, fldShownFormula: 'visible' });
    expect(answers).toContainEqual({ label: 'Allowlisted formula', text: 'visible' });
    expect(unknownFields).toEqual([]);
  });

  test('renders the string a loader returns, and treats a loader failure as a config error', async () => {
    const formConfig: FormSubmissionCopyConfig = {
      ...testForm,
      fieldAllowList: [{ field: 'fldThing', label: 'Thing', load: async (value) => `loaded ${String(value)}` }],
    };
    expect((await resolve({ ...baseFields, fldThing: ['rec1'] }, formConfig)).answers).toEqual([{ label: 'Thing', text: 'loaded rec1' }]);

    const failing: FormSubmissionCopyConfig = {
      ...testForm,
      fieldAllowList: [{
        field: 'fldThing', label: 'Thing', load: async () => {
          throw new Error('boom');
        },
      }],
    };
    await expect(resolve({ ...baseFields, fldThing: ['rec1'] }, failing)).rejects.toMatchObject({ field: 'fldThing', kind: 'loader-failed' });
  });

  test('loads the round name for course applications', async () => {
    await testDb.insert(applicationsRoundTable, { id: 'recRound1', courseRoundIntensity: 'AGI Strategy (2026 Jan W02) - Part-time' });
    const formConfig = getFormSubmissionCopyConfig('AGI Strategy Course application')!;
    const { answers } = await resolve(courseBaseFields, formConfig);
    expect(answers).toContainEqual({ label: 'Round', text: 'AGI Strategy (2026 Jan W02) - Part-time' });

    await expect(resolve({ ...courseBaseFields, [ROUND]: ['recMissing'] }, formConfig)).rejects.toMatchObject({ field: ROUND, kind: 'loader-failed' });
  });
});

describe('loadCityNames', () => {
  test('reads City (Full) by field id for each linked record and joins them', async () => {
    const fetchMock = vi.fn(async (url: string) => new Response(JSON.stringify({
      fields: { fldaasbV5lPPtLRlv: url.includes('recCity1') ? 'London, United Kingdom' : 'Paris, France' },
    })));
    vi.stubGlobal('fetch', fetchMock);

    expect(await loadCityNames(['recCity1', 'recCity2'])).toBe('London, United Kingdom, Paris, France');
    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.airtable.com/v0/appnJbsG1eWbAdEvf/tblXuc10ZLXxqU1lO/recCity1?returnFieldsByFieldId=true',
      { headers: { Authorization: 'Bearer fake-pat' } },
    );
  });

  test('throws on a non-OK response', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('{}', { status: 404 })));
    await expect(loadCityNames(['recMissing'])).rejects.toThrow('HTTP 404');
  });
});

describe('formatFormSubmissionCopyEmail', () => {
  test('builds the subject from the form title', () => {
    expect(formatFormSubmissionCopyEmail({ formTitle: 'AGI Strategy Course application', answers: [] }).subject)
      .toBe('Copy of your responses: AGI Strategy Course application');
  });

  test('opens with the form title and leaves the greeting and sign-off to the template', () => {
    const { html } = formatFormSubmissionCopyEmail({ formTitle: 'Test form', answers: [] });
    expect(html).toContain('Thanks for filling out "Test form". Here\'s what we received.');
    expect(html).not.toContain('Hi');
    expect(html).not.toContain('Best wishes');
  });

  test('formats values', async () => {
    const html = await render({ fldSkills: ['Writing', 'Research', 3], fldExperience: true });
    expect(html).toContain('>Writing, Research, 3</div>');
    expect(html).toContain('How have you engaged with AI safety so far?</strong></p><div');
    expect(html).toMatch(/>Yes<\/div>/);
  });

  test('never renders fields that are not in the config', async () => {
    const html = await render({ fldDecision: 'Strong yes', fldTotalScore: 42 });
    expect(html).not.toContain('Strong yes');
    expect(html).not.toContain('42');
  });

  test('caps each value at 16,000 characters', async () => {
    const html = await render({ fldExperience: 'a'.repeat(20_000) });
    expect(html).toContain(`>${'a'.repeat(16_000)}</div>`);
  });

  test('escapes labels, values and form title', () => {
    const { html } = formatFormSubmissionCopyEmail({
      formTitle: '<script>t</script>',
      answers: [{ label: '<i>label</i>', text: 'x & <y>' }],
    });
    expect(html).not.toContain('<script>');
    expect(html).not.toContain('<i>');
    expect(html).toContain('&#60;script&#62;t&#60;/script&#62;');
    expect(html).toContain('&#60;i&#62;label&#60;/i&#62;');
    expect(html).toContain('x &#38; &#60;y&#62;');
  });

  test('shows answers in a pre-wrap block so line breaks survive', async () => {
    const html = await render({ fldExperience: 'Line one\n- bullet' });
    expect(html).toMatch(/<div style="[^"]*white-space:pre-wrap[^"]*">Line one\n- bullet<\/div>/);
    expect(html).toContain('border-radius:8px');
  });

  test('renders City and the diversity answers for course applications', async () => {
    await testDb.insert(applicationsRoundTable, { id: 'recRound1', courseRoundIntensity: 'AGI Strategy (2026 Jan W02) - Part-time' });
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ fields: { fldaasbV5lPPtLRlv: 'London, United Kingdom' } }))));
    const { answers, unknownFields } = await resolve({
      ...courseBaseFields,
      fldZHjHXBvzY0oxr5: ['recCity1'], // City
      fld43elHu306SVJiL: 'Woman', // Gender
      fldBrqUfs4zJVvRRg: ['Asian', 'White'], // Ethnic origin
      fldlvFcXtNYdhaWLW: 36, // Age
      fldbk4IiZ1UzY76mA: 25, // Engagement hours with AI safety.
    }, getFormSubmissionCopyConfig('AGI Strategy Course application'), {});
    expect(answers).toContainEqual({ label: 'Where will you be based during this course?', text: 'London, United Kingdom' });
    expect(answers).toContainEqual({ label: 'Gender', text: 'Woman' });
    expect(answers).toContainEqual({ label: 'Ethnic origin', text: 'Asian, White' });
    expect(answers).toContainEqual({ label: 'Age (in years)', text: '36' });
    expect(answers).toContainEqual({ label: 'How many hours have you spent engaging with AI safety content so far?', text: '25' });
    expect(unknownFields).toEqual([]);
  });
});
