import { type GetServerSideProps } from 'next';
import { vanityUrlsTable } from '@bluedot/db';
// eslint-disable-next-line import/no-extraneous-dependencies
import { metrics } from '@opentelemetry/api';
import db from '../lib/api/db';
import { sanitizeUrl } from '../lib/sanitizeUrl';

const meter = metrics.getMeter('vanity-urls');
const vanityRedirectCounter = meter.createCounter('vanity_redirect_total', {
  description:
    'Vanity URL redirect attempts, labelled by outcome (hit | miss). Per-slug conversion tracked downstream via UTMs on the destination page.',
});

const VanityRedirectPage = () => null;

export const getServerSideProps: GetServerSideProps = async ({ params }) => {
  const raw = typeof params?.vanity === 'string' ? params.vanity : '';
  const slug = raw.toLowerCase();

  if (!slug) {
    return { notFound: true };
  }

  const row = await db.getFirst(vanityUrlsTable, {
    filter: { vanityName: slug },
    sortBy: 'vanityName',
  });

  const destination = row?.isActive ? sanitizeUrl(row.resolvedUrl) : undefined;
  if (!destination) {
    vanityRedirectCounter.add(1, { status: 'miss' });
    return { notFound: true };
  }

  vanityRedirectCounter.add(1, { status: 'hit' });
  return {
    redirect: {
      destination,
      statusCode: 307,
    },
  };
};

export default VanityRedirectPage;
