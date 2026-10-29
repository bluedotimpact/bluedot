import { describe, expect, test } from 'vitest';
import { suggestEmailFix } from './emailSuggestion';

describe('suggestEmailFix', () => {
  // Typo domains seen in production user records
  test.each([
    ['jane@gmai.com', 'jane@gmail.com'],
    ['jane@gmaill.com', 'jane@gmail.com'],
    ['jane@gamil.com', 'jane@gmail.com'],
    ['jane@gmial.com', 'jane@gmail.com'],
    ['jane@gnail.com', 'jane@gmail.com'],
    ['jane@gmail.con', 'jane@gmail.com'],
    ['jane@gmail.co', 'jane@gmail.com'],
    ['jane@gmail.om', 'jane@gmail.com'],
    ['jane@gmail.cm', 'jane@gmail.com'],
    ['jane@gmail.comn', 'jane@gmail.com'],
    ['jane@gmaill.con', 'jane@gmail.com'],
    ['jane@gmail', 'jane@gmail.com'],
    ['jane@hitmail.com', 'jane@hotmail.com'],
    ['jane@hotmial.nl', 'jane@hotmail.nl'],
    ['jane@outlokk.com', 'jane@outlook.com'],
    ['jane@yaho.com', 'jane@yahoo.com'],
    ['jane@icoud.com', 'jane@icloud.com'],
    ['jane@protonmai.com', 'jane@protonmail.com'],
  ])('suggests a fix for %s', (email, expected) => {
    expect(suggestEmailFix(email)).toBe(expected);
  });

  test.each([
    'jane@gmail.com',
    'jane@googlemail.com',
    'jane@hotmail.co.uk',
    'jane@yahoo.co.in',
    'jane@yahoo.ca',
    'jane@hotmail.ch',
    'jane@ymail.com',
    'jane@mail.com',
    'jane@email.com',
    'jane@qq.com',
    'jane@mac.com',
    'jane@mozmail.com',
    'jane@smail.iitm.ac.in',
    'jane@umail.ucc.ie',
    'jane@bluedot.org',
  ])('leaves %s alone', (email) => {
    expect(suggestEmailFix(email)).toBeNull();
  });

  test('keeps the local part as typed and ignores surrounding whitespace', () => {
    expect(suggestEmailFix('  Jane.Doe+apply@GMIAL.COM ')).toBe('Jane.Doe+apply@gmail.com');
  });

  test('returns null for input that is not an email yet', () => {
    expect(suggestEmailFix('')).toBeNull();
    expect(suggestEmailFix('jane')).toBeNull();
    expect(suggestEmailFix('@gmial.com')).toBeNull();
  });
});
