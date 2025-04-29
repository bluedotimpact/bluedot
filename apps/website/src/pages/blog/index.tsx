import {
  Section,
  Breadcrumbs,
  ErrorSection,
  ProgressDots,
  HeroSection,
} from '@bluedot/ui';
import Head from 'next/head';
import useAxios from 'axios-hooks';
import { HeroH1, HeroMiniTitle } from '@bluedot/ui/src/HeroSection';
import { ROUTES } from '../../lib/routes';
import { GetBlogsResponse } from '../api/cms/blogs';
import BlogListSection from '../../components/blog/BlogListSection';

const CURRENT_ROUTE = ROUTES.blog;

const BlogPage = () => {
  const [{ data, loading, error }] = useAxios<GetBlogsResponse>({
    method: 'get',
    url: '/api/cms/blogs',
  });

  return (
    <div>
      <Head>
        <title>{`${CURRENT_ROUTE.title} | BlueDot Impact`}</title>
        <meta name="description" content="Insights and updates from BlueDot Impact" />
      </Head>
      <HeroSection>
        <HeroMiniTitle>Blog</HeroMiniTitle>
        <HeroH1>Insights on our work and focus areas</HeroH1>
      </HeroSection>
      <Breadcrumbs route={CURRENT_ROUTE} />
      {loading && <Section title="Blog Articles"><ProgressDots /></Section>}
      {error && <ErrorSection error={error} />}
      {data?.blogs && <BlogListSection blogs={data.blogs} />}
    </div>
  );
};

export default BlogPage;
