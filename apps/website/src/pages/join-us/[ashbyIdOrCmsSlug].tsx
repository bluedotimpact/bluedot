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
import Script from 'next/script';
import { ErrorView } from '@bluedot/ui/src/ErrorView';
import { GetServerSidePropsContext } from 'next';
import { ROUTES } from '../../lib/routes';
import { GetAshbyJobsResponse } from '../../components/join-us/JobsListSection';
import { GetJobResponse } from '../api/cms/jobs/[slug]';
import MarkdownExtendedRenderer from '../../components/courses/MarkdownExtendedRenderer';

// Server-side props to fetch job data for meta tags
export async function getServerSideProps(context: GetServerSidePropsContext) {
  const { ashbyIdOrCmsSlug } = context.params as { ashbyIdOrCmsSlug: string };

  // Check if it's an Ashby ID (UUID format)
  const isAshbyId = ashbyIdOrCmsSlug.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);

  try {
    if (isAshbyId) {
      // Fetch Ashby jobs
      const response = await fetch('https://api.ashbyhq.com/posting-api/job-board/bluedot');
      if (!response.ok) {
        // Silently handle error, return null data
        return {
          props: {
            ashbyIdOrCmsSlug,
            initialJobData: null,
            jobType: 'ashby' as const,
          },
        };
      }
      const data = await response.json();
      const job = data.jobs?.find((j: { id: string; title: string; location: string; publishedAt: string }) => j.id === ashbyIdOrCmsSlug);

      return {
        props: {
          ashbyIdOrCmsSlug,
          initialJobData: job ? {
            title: job.title,
            description: job.location,
            id: job.id,
            publishedAt: job.publishedAt,
          } : null,
          jobType: 'ashby' as const,
        },
      };
    }
    // Fetch CMS job
    const baseUrl = 'https://bluedot.org';
    const response = await fetch(`${baseUrl}/api/cms/jobs/${ashbyIdOrCmsSlug}`);

    if (response.ok) {
      const data = await response.json();
      return {
        props: {
          ashbyIdOrCmsSlug,
          initialJobData: data.job ? {
            title: data.job.title,
            description: data.job.subtitle,
            id: data.job.id,
            publishedAt: data.job.publishedAt,
            body: data.job.body,
          } : null,
          jobType: 'cms' as const,
        },
      };
    }
  } catch (error) {
    // Silently handle errors - no console.error to avoid server logs
    // Return graceful fallback
  }

  // Return null data if fetch fails
  return {
    props: {
      ashbyIdOrCmsSlug,
      initialJobData: null,
      jobType: isAshbyId ? 'ashby' as const : 'cms' as const,
    },
  };
}

type JobPostingPageProps = {
  ashbyIdOrCmsSlug: string;
  initialJobData: {
    title: string;
    description: string;
    id: string;
    publishedAt?: string;
    body?: string;
  } | null;
  jobType: 'ashby' | 'cms';
};

const JobPostingPage = ({ ashbyIdOrCmsSlug, initialJobData, jobType }: JobPostingPageProps) => {
  // Use SSR data for meta tags
  const metaTitle = initialJobData?.title || 'Job Posting';
  const metaDescription = initialJobData?.description || 'Join our team at BlueDot Impact';
  const currentUrl = `https://bluedot.org${ROUTES.joinUs.url}/${ashbyIdOrCmsSlug}`;

  return (
    <div>
      <Head>
        <title>{`${metaTitle} | BlueDot Impact`}</title>
        <meta name="description" content={metaDescription} />
        <meta property="og:title" content={`${metaTitle} | BlueDot Impact`} />
        <meta property="og:description" content={metaDescription} />
        <meta property="og:image" content={`https://bluedot.org/api/og/job/${ashbyIdOrCmsSlug}`} />
        <meta property="og:url" content={currentUrl} />
        <meta property="og:type" content="website" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />

        {/* Twitter card tags */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={`${metaTitle} | BlueDot Impact`} />
        <meta name="twitter:description" content={metaDescription} />
        <meta name="twitter:image" content={`https://bluedot.org/api/og/job/${ashbyIdOrCmsSlug}`} />

        {/* Structured data for job posting */}
        {initialJobData && (
          <script
            type="application/ld+json"
            // eslint-disable-next-line react/no-danger
            dangerouslySetInnerHTML={{
              __html: JSON.stringify({
                '@context': 'https://schema.org',
                '@type': 'JobPosting',
                title: initialJobData.title,
                description: jobType === 'cms' ? initialJobData.body : initialJobData.description,
                datePosted: initialJobData.publishedAt ? new Date(initialJobData.publishedAt).toISOString() : undefined,
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
                identifier: initialJobData.id,
                mainEntityOfPage: {
                  '@type': 'WebPage',
                  '@id': currentUrl,
                },
              }),
            }}
          />
        )}
      </Head>

      {/* Render the appropriate component based on type */}
      {jobType === 'ashby'
        ? <AshbyJobPostingPage ashbyId={ashbyIdOrCmsSlug} />
        : <CmsJobPostingPage slug={ashbyIdOrCmsSlug} />}
    </div>
  );
};

const CmsJobPostingPage = ({ slug }: { slug: string }) => {
  const [{ data, loading, error }] = useAxios<GetJobResponse>({
    method: 'get',
    url: `/api/cms/jobs/${slug}`,
  });

  const currentRoute: BluedotRoute = {
    title: data?.job?.title || 'Job Posting',
    url: `${ROUTES.joinUs.url}/${slug}`,
    parentPages: [...(ROUTES.joinUs.parentPages ?? []), ROUTES.joinUs],
  };

  return (
    <div>
      {loading && <ProgressDots />}
      {!loading && error && <ErrorSection error={error} />}
      {data?.job && (
        <>
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
      {!loading && (error || (data && !job)) && (
        <ErrorSection error={error || new Error('Job not found. This job posting may have been closed.')} />
      )}
      {job && (
        <>
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
  const [scriptError, setScriptError] = useState<Error | null>(null);

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
        onError={(e: Error) => {
          setScriptError(e);
        }}
      />
    </>
  );
};

export default JobPostingPage;
