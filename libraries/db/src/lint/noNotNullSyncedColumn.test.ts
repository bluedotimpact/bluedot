// @vitest-environment node
import { ESLint } from 'eslint';
import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, test } from 'vitest';

// Runs the real ESLint with this package's config on the real schema.ts, so it also proves the rule and its allow
// list are switched on for that file. Only this rule runs, without type info: the rest of the config is slow on a
// file this size (it timed out on CI) and isn't what's being tested.
const packageRoot = path.resolve(__dirname, '../..');
const RULE = '@bluedot/custom/no-not-null-synced-column';
const eslint = new ESLint({
  cwd: packageRoot,
  ruleFilter: ({ ruleId }) => ruleId === RULE,
  overrideConfig: { languageOptions: { parserOptions: { projectService: false, project: null } } },
});
const SCHEMA = 'src/schema.ts';
const schema = fs.readFileSync(path.join(packageRoot, SCHEMA), 'utf8');

const UNIT_COLUMNS = 'export const unitTable = pgAirtable(\'unit\', {\n  baseId: COURSE_BUILDER_BASE_ID,\n  tableId: \'tblsDKJ8VCyO619nk\',\n  columns: {\n';
const UNIT_COURSE_ID = 'courseId: {\n      pgColumn: text().notNull(),\n      airtableId: \'fldLmQZ0ISTr7xQUE\',';

const ruleMessages = async (code: string) => {
  const [result] = await eslint.lintText(code, { filePath: SCHEMA });
  expect(result!.messages.filter((m) => m.fatal)).toEqual([]);
  return result!.messages.filter((m) => m.ruleId === RULE).map((m) => m.message);
};

const withUnitColumn = (column: string) => {
  expect(schema).toContain(UNIT_COLUMNS);
  return schema.replace(UNIT_COLUMNS, `${UNIT_COLUMNS}    ${column}\n`);
};

describe('no-not-null-synced-column lint rule', () => {
  test('schema.ts as it is today has no errors', async () => {
    expect(await ruleMessages(schema)).toEqual([]);
  });

  test.each([
    ['a plain notNull()', 'newColumn: { pgColumn: text().notNull(), airtableId: \'fldNew\' },'],
    ['notNull() inside a longer chain', 'newColumn: { pgColumn: text().notNull().default(\'\'), airtableId: \'fldNew\' },'],
    ['notNull() on an array', 'newColumn: { pgColumn: text().array().notNull(), airtableId: \'fldNew\' },'],
    ['notNull() behind a type cast', 'newColumn: { pgColumn: text().notNull() as never, airtableId: \'fldNew\' },'],
  ])('flags a new synced column with %s', async (_, column) => {
    expect(await ruleMessages(withUnitColumn(column))).toEqual([
      expect.stringContaining('Synced column unit.newColumn uses notNull()'),
    ]);
  });

  test('flags an allowed column that no longer uses notNull()', async () => {
    expect(schema).toContain(UNIT_COURSE_ID);
    const code = schema.replace(UNIT_COURSE_ID, UNIT_COURSE_ID.replace('text().notNull()', 'text()'));

    expect(await ruleMessages(code)).toEqual([
      expect.stringContaining('unit.courseId is in the allow list but no longer uses notNull()'),
    ]);
  });

  test('ignores the same column shape outside pgAirtable', async () => {
    const code = `${schema}\nexport const otherTable = pgSomething('other', { columns: { a: { pgColumn: text().notNull() } } });\n`;

    expect(await ruleMessages(code)).toEqual([]);
  });
});
