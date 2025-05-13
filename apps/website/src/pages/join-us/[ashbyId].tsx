import {
  HeroSection,
  HeroH1,
  HeroH2,
  Section,
  Breadcrumbs,
  BluedotRoute,
  ErrorSection,
  ProgressDots,
} from '@bluedot/ui';
import Head from 'next/head';
import useAxios from 'axios-hooks';
import { useRouter } from 'next/router';
import Script from 'next/script';
import { ROUTES } from '../../lib/routes';
import { GetAshbyJobsResponse } from '../../components/join-us/JobsListSection';

const JobPostingPage = () => {
  const { query: { ashbyId } } = useRouter();
  if (typeof ashbyId !== 'string') {
    return 'Invalid job Ashby id';
  }

  const [{ data, loading, error }] = useAxios<GetAshbyJobsResponse>({
    method: 'get',
    url: 'https://api.ashbyhq.com/posting-api/job-board/bluedot',
  });

  const job = data?.jobs.find((j) => j.id === ashbyId);

  const currentRoute: BluedotRoute = {
    title: job?.title || 'Job Posting',
    url: `${ROUTES.joinUs.url}/${ashbyId}`,
    parentPages: [...(ROUTES.joinUs.parentPages ?? []), ROUTES.joinUs],
  };

  return (
    <div>
      {loading && <ProgressDots />}
      {error && <ErrorSection error={error} />}
      {job && (
        <>
          <Head>
            <title>{`${job?.title} | BlueDot Impact`}</title>
            <meta name="description" content={job.location} />
            <script
              type="application/ld+json"
              // eslint-disable-next-line react/no-danger
              dangerouslySetInnerHTML={{
                __html: JSON.stringify({
                  '@context': 'https://schema.org',
                  '@type': 'JobPosting',
                  title: job.title,
                  description: job.descriptionHtml,
                  datePosted: job.publishedAt,
                  hiringOrganization: {
                    '@type': 'Organization',
                    name: 'BlueDot Impact',
                    sameAs: 'https://bluedot.org',
                  },
                  jobLocation: {
                    '@type': 'Place',
                    address: {
                      '@type': 'PostalAddress',
                      addressLocality: 'London',
                      addressCountry: 'United Kingdom',
                    },
                  },
                  identifier: job.id,
                  mainEntityOfPage: {
                    '@type': 'WebPage',
                    '@id': `${ROUTES.joinUs.url}/${ashbyId}`,
                  },
                }),
              }}
            />
          </Head>
          <HeroSection>
            <HeroH1>{job.title}</HeroH1>
            {job.location && <HeroH2>{job.location}</HeroH2>}
          </HeroSection>
          <Breadcrumbs route={currentRoute} />
          <Section className="max-w-3xl">
            {/* eslint-disable-next-line react/no-danger */}
            <div className="prose" dangerouslySetInnerHTML={{ __html: job.descriptionHtml }} />
            <AshbyApplicationFormEmbed id={ashbyId} />
          </Section>
        </>
      )}
    </div>
  );
};

const AshbyApplicationFormEmbed = ({ id }: { id: string }) => {
  return (
    <>
      <div id="ashby_embed" className="application-form-embed-container mt-6" />
      <Script
        id="ashby-script"
        src="https://jobs.ashbyhq.com/bluedot/embed?version=2"
        onLoad={() => {
          // eslint-disable-next-line no-underscore-dangle
          window.__Ashby.iFrame().load({ jobPostingId: id, displayMode: 'application-form-only', autoScroll: false });
        }}
      />
    </>
  );
};

export default JobPostingPage;
