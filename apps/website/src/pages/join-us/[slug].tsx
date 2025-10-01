import {
  HeroSection,
  HeroH1,
  HeroH2,
  Section,
  Breadcrumbs,
  BluedotRoute,
  HeroCTAContainer,
  CTALinkOrButton,
} from '@bluedot/ui';
import Head from 'next/head';
import { GetServerSideProps } from 'next';
import { JobPosting } from '@bluedot/db';
import { ROUTES } from '../../lib/routes';
import { getJobIfPublished } from '../api/cms/jobs/[slug]';
import MarkdownExtendedRenderer from '../../components/courses/MarkdownExtendedRenderer';

type JobPostingPageProps = {
  slug: string;
  job: JobPosting;
};

const JobPostingPage = ({ slug, job }: JobPostingPageProps) => {
  const currentRoute: BluedotRoute = {
    title: job.title || 'Job Posting',
    url: `${ROUTES.joinUs.url}/${slug}`,
    parentPages: [...(ROUTES.joinUs.parentPages ?? []), ROUTES.joinUs],
  };

  return (
    <div>
      {job && (
        <>
          <Head>
            <title>{`${job.title} | BlueDot Impact`}</title>
            <meta name="description" content={job.subtitle} />
            <script
              type="application/ld+json"
              // eslint-disable-next-line react/no-danger
              dangerouslySetInnerHTML={{
                __html: JSON.stringify({
                  '@context': 'https://schema.org',
                  '@type': 'JobPosting',
                  title: job.title,
                  description: job.body,
                  datePosted: job.publishedAt ? new Date(job.publishedAt * 1000).toISOString() : undefined,
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
                    '@id': `${ROUTES.joinUs.url}/${slug}`,
                  },
                }),
              }}
            />
          </Head>
          <HeroSection>
            <HeroH1>{job.title}</HeroH1>
            {job.subtitle && <HeroH2>{job.subtitle}</HeroH2>}
            {job.applicationUrl && (
              <HeroCTAContainer>
                <CTALinkOrButton url={job.applicationUrl}>Apply Now</CTALinkOrButton>
              </HeroCTAContainer>
            )}
          </HeroSection>
          <Breadcrumbs route={currentRoute} />
          <Section className="max-w-3xl">
            <MarkdownExtendedRenderer>
              {job.body}
            </MarkdownExtendedRenderer>
            {job.applicationUrl && (
              <div className="my-8">
                <CTALinkOrButton url={job.applicationUrl}>Apply Now</CTALinkOrButton>
              </div>
            )}
          </Section>
        </>
      )}
    </div>
  );
};

export const getServerSideProps: GetServerSideProps<JobPostingPageProps> = async ({ params }) => {
  const slug = params?.slug as string;

  if (!slug) {
    return {
      notFound: true,
    };
  }

  try {
    const job = await getJobIfPublished(slug);

    return {
      props: {
        slug,
        job,
      },
    };
  } catch (error) {
    // Error fetching job data (likely not found)
    return {
      notFound: true,
    };
  }
};

export default JobPostingPage;
