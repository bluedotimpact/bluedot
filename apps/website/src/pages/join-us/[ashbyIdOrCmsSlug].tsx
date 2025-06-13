import { useState } from 'react';
import {
  HeroSection,
  HeroH1,
  HeroH2,
  Section,
  Breadcrumbs,
  BluedotRoute,
  ErrorSection,
  ProgressDots,
  HeroCTAContainer,
  CTALinkOrButton,
} from '@bluedot/ui';
import Head from 'next/head';
import useAxios from 'axios-hooks';
import { useRouter } from 'next/router';
import Script from 'next/script';
import { ErrorView } from '@bluedot/ui/src/ErrorView';
import { ROUTES } from '../../lib/routes';
import { GetAshbyJobsResponse } from '../../components/join-us/JobsListSection';
import { GetJobResponse } from '../api/cms/jobs/[slug]';
import MarkdownExtendedRenderer from '../../components/courses/MarkdownExtendedRenderer';

const JobPostingPage = () => {
  const { query: { ashbyIdOrCmsSlug } } = useRouter();
  if (typeof ashbyIdOrCmsSlug !== 'string') {
    return <ErrorSection error={new Error('Job not found: invalid path')} />;
  }

  // ashbyIds are always uuids
  if (ashbyIdOrCmsSlug.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/)) {
    return <AshbyJobPostingPage ashbyId={ashbyIdOrCmsSlug} />;
  }

  return <CmsJobPostingPage slug={ashbyIdOrCmsSlug} />;
};

const CmsJobPostingPage = ({ slug }: { slug: string }) => {
  const [{ data, loading, error }] = useAxios<GetJobResponse>({
    method: 'get',
    url: `/api/cms/jobs/${slug}`,
  });

  const currentRoute: BluedotRoute = {
    title: data?.job.title || 'Job Posting',
    url: `${ROUTES.joinUs.url}/${slug}`,
    parentPages: [...(ROUTES.joinUs.parentPages ?? []), ROUTES.joinUs],
  };

  return (
    <div>
      {loading && <ProgressDots />}
      {error && <ErrorSection error={error} />}
      {data?.job && (
        <>
          <Head>
            <title>{`${data.job.title} | BlueDot Impact`}</title>
            <meta name="description" content={data.job.subtitle} />
            <script
              type="application/ld+json"
              // eslint-disable-next-line react/no-danger
              dangerouslySetInnerHTML={{
                __html: JSON.stringify({
                  '@context': 'https://schema.org',
                  '@type': 'JobPosting',
                  title: data.job.title,
                  description: data.job.body,
                  datePosted: data.job.publishedAt ? new Date(data.job.publishedAt * 1000).toISOString() : undefined,
                  hiringOrganization: {
                    '@type': 'Organization',
                    name: 'BlueDot Impact',
                    sameAs: 'https://bluedot.org',
                    logo: 'https://bluedot.org/images/logo/icon-on-blue.svg',
                  },
                  jobLocation: {
                    '@type': 'Place',
                    address: {
                      '@type': 'PostalAddress',
                      addressLocality: 'London',
                      addressCountry: 'United Kingdom',
                    },
                  },
                  identifier: data.job.id,
                  mainEntityOfPage: {
                    '@type': 'WebPage',
                    '@id': `${ROUTES.joinUs.url}/${slug}`,
                  },
                }),
              }}
            />
          </Head>
          <HeroSection>
            <HeroH1>{data.job.title}</HeroH1>
            {data.job.subtitle && <HeroH2>{data.job.subtitle}</HeroH2>}
            {data.job.applicationUrl && (
              <HeroCTAContainer>
                <CTALinkOrButton url={data.job.applicationUrl}>Apply Now</CTALinkOrButton>
              </HeroCTAContainer>
            )}
          </HeroSection>
          <Breadcrumbs route={currentRoute} />
          <Section className="max-w-3xl">
            <MarkdownExtendedRenderer>
              {data.job.body}
            </MarkdownExtendedRenderer>
            {data.job.applicationUrl && (
              <div className="my-8">
                <CTALinkOrButton url={data.job.applicationUrl}>Apply Now</CTALinkOrButton>
              </div>
            )}
          </Section>
        </>
      )}
    </div>
  );
};

const AshbyJobPostingPage = ({ ashbyId }: { ashbyId: string }) => {
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
      {(error || (data && !job)) && <ErrorSection error={error || new Error('Job not found. This job posting may have been closed.')} />}
      {job && (
        <>
          <Head>
            <title>{`${job.title} | BlueDot Impact`}</title>
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
                    logo: 'https://bluedot.org/images/logo/icon-on-blue.svg',
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
            <HeroCTAContainer>
              <CTALinkOrButton url="#application-form-anchor">Apply Now</CTALinkOrButton>
            </HeroCTAContainer>
          </HeroSection>
          <Breadcrumbs route={currentRoute} />
          <Section className="max-w-3xl">
            {/* eslint-disable-next-line react/no-danger */}
            <div className="prose prose-p:text-size-md prose-li:text-size-md prose-p:leading-normal prose-li:leading-normal max-w-none" dangerouslySetInnerHTML={{ __html: job.descriptionHtml }} />
            <div id="application-form-anchor" className="invisible relative bottom-24" />
            <AshbyApplicationFormEmbed id={ashbyId} />
          </Section>
        </>
      )}
    </div>
  );
};

const AshbyApplicationFormEmbed = ({ id }: { id: string }) => {
  const [scriptError, setScriptError] = useState(null);

  return (
    <>
      <div id="ashby_embed" className="application-form-embed-container mt-6" />
      {scriptError && (
        <ErrorView error={new Error('Failed to load application form. Try refreshing the page, or contact us.', { cause: scriptError })} />
      )}
      <Script
        id="ashby-script"
        src="https://jobs.ashbyhq.com/bluedot/embed?version=2"
        onLoad={() => {
          // eslint-disable-next-line no-underscore-dangle
          window.__Ashby.iFrame().load({ jobPostingId: id, displayMode: 'application-form-only', autoScroll: false });
        }}
        onError={(e) => {
          setScriptError(e);
        }}
      />
    </>
  );
};

export default JobPostingPage;
