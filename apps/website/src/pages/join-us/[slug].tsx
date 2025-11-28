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
import { GetStaticProps, GetStaticPaths } from 'next';
import { JobPosting, jobPostingTable } from '@bluedot/db';
import path from 'path';
import { ROUTES } from '../../lib/routes';
import MarkdownExtendedRenderer from '../../components/courses/MarkdownExtendedRenderer';
import db from '../../lib/api/db';
import { fileExists } from '../../utils/fileExists';

type JobPostingPageProps = {
  slug: string;
  job: JobPosting;
  jobOgImage?: string;
};

const JobPostingPage = ({ slug, job, jobOgImage }: JobPostingPageProps) => {
  const currentRoute: BluedotRoute = {
    title: job.title || 'Job Posting',
    url: `${ROUTES.joinUs.url}/${slug}`,
    parentPages: [...(ROUTES.joinUs.parentPages ?? []), ROUTES.joinUs],
  };

  return (
    <div>
      <Head>
        <title>{`${job.title} | BlueDot Impact`}</title>
        <meta name="description" content={job.subtitle} />
        <meta key="og:title" property="og:title" content={job.title} />
        <meta key="og:description" property="og:description" content={job.subtitle} />
        <meta key="og:site_name" property="og:site_name" content="BlueDot Impact" />
        <meta key="og:type" property="og:type" content="website" />
        <meta key="og:url" property="og:url" content={`https://bluedot.org/join-us/${encodeURIComponent(slug)}`} />
        <meta key="og:image" property="og:image" content={jobOgImage || 'https://bluedot.org/images/logo/link-preview-fallback.png'} />
        <meta key="og:image:width" property="og:image:width" content="1200" />
        <meta key="og:image:height" property="og:image:height" content="630" />
        <meta key="og:image:type" property="og:image:type" content="image/png" />
        <meta key="og:image:alt" property="og:image:alt" content="BlueDot Impact logo" />
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
    </div>
  );
};

export const getStaticPaths: GetStaticPaths = async () => {
  // CI is not currently set up to support connecting to the database at build
  // time, so return no paths, and rely on `fallback: 'blocking'` to render the pages on demand.
  return {
    paths: [],
    fallback: 'blocking',
  };
};

export const getStaticProps: GetStaticProps<JobPostingPageProps> = async ({ params }) => {
  const slug = params?.slug as string;

  if (!slug) {
    return {
      notFound: true,
    };
  }

  try {
    // Fetches both published and unlisted jobs, but not unpublished ones
    const job = await db.get(jobPostingTable, { slug, publicationStatus: { '!=': 'Unpublished' } });

    let jobOgImage: string | undefined;
    if (await fileExists(path.join(process.cwd(), 'public', 'images', 'jobs', 'link-preview', `${job.slug}.png`))) {
      jobOgImage = `${process.env.NEXT_PUBLIC_SITE_URL}/images/jobs/link-preview/${job.slug}.png`;
    }

    return {
      props: {
        slug,
        job,
        jobOgImage,
      },
      revalidate: 300,
    };
  } catch (error) {
    // Error fetching job data (likely not found)
    return {
      notFound: true,
      revalidate: 60, // Cache 404s for only 1 minute instead of 1 year
    };
  }
};

export default JobPostingPage;
