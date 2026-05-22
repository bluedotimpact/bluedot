import { vanityUrlsTable } from '@bluedot/db';
import type { GetServerSidePropsContext } from 'next';
import { describe, expect, test } from 'vitest';
import { getServerSideProps } from '../../pages/[vanity]';
import { setupTestDb, testDb } from '../dbTestUtils';

setupTestDb();

const callGetServerSideProps = (vanity: string) =>
  getServerSideProps({
    params: { vanity },
  } as unknown as GetServerSidePropsContext);

describe('vanity URL catch-all page', () => {
  test('redirects with 307 to resolvedUrl on hit', async () => {
    await testDb.insert(vanityUrlsTable, {
      vanityName: 'minutephysics',
      resolvedUrl: 'https://bluedot.org/courses/future-of-ai?utm_campaign=minutephysics',
      isActive: true,
    });

    const result = await callGetServerSideProps('minutephysics');

    expect(result).toEqual({
      redirect: {
        destination: 'https://bluedot.org/courses/future-of-ai?utm_campaign=minutephysics',
        statusCode: 307,
      },
    });
  });

  test('lowercases incoming slug before lookup', async () => {
    await testDb.insert(vanityUrlsTable, {
      vanityName: 'mrbeast',
      resolvedUrl: 'https://bluedot.org/courses/future-of-ai',
      isActive: true,
    });

    const result = await callGetServerSideProps('MrBeast');

    expect(result).toEqual({
      redirect: {
        destination: 'https://bluedot.org/courses/future-of-ai',
        statusCode: 307,
      },
    });
  });

  test('returns notFound when slug has no matching row', async () => {
    const result = await callGetServerSideProps('does-not-exist');
    expect(result).toEqual({ notFound: true });
  });

  test('returns notFound when row is inactive', async () => {
    await testDb.insert(vanityUrlsTable, {
      vanityName: 'retired',
      resolvedUrl: 'https://bluedot.org/courses/future-of-ai',
      isActive: false,
    });

    const result = await callGetServerSideProps('retired');
    expect(result).toEqual({ notFound: true });
  });

  test('returns notFound for unmatched slugs containing unusual characters', async () => {
    const result = await callGetServerSideProps('has spaces');
    expect(result).toEqual({ notFound: true });
  });

  test('rejects non-http(s) resolvedUrl to avoid open-redirect abuse', async () => {
    await testDb.insert(vanityUrlsTable, {
      vanityName: 'evil',
      resolvedUrl: ['java', 'script:alert(1)'].join(''),
      isActive: true,
    });

    const result = await callGetServerSideProps('evil');
    expect(result).toEqual({ notFound: true });
  });
});
