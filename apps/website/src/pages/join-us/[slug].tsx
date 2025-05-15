import {
  CTALinkOrButton,
  HeroSection,
  HeroH1,
  HeroH2,
  HeroCTAContainer,
  Section,
  Breadcrumbs,
  BluedotRoute,
  ErrorSection,
  ProgressDots,
} from '@bluedot/ui';
import Head from 'next/head';
import useAxios from 'axios-hooks';
import { useRouter } from 'next/router';
import { ROUTES } from '../../lib/routes';
import { GetJobResponse } from '../api/cms/jobs/[slug]';
import MarkdownExtendedRenderer from '../../components/courses/MarkdownExtendedRenderer';

const JobPostingPage = () => {
  const { query: { slug } } = useRouter();
  if (typeof slug !== 'string') {
    return 'Invalid job slug';
  }

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

export default JobPostingPage;
