import {
  Breadcrumbs,
  HeroSection,
} from '@bluedot/ui';
import Head from 'next/head';
import { HeroH1, HeroMiniTitle } from '@bluedot/ui/src/HeroSection';
import { ROUTES } from '../../lib/routes';
import BlogListSection from '../../components/blog/BlogListSection';

const CURRENT_ROUTE = ROUTES.blog;

const BlogPage = () => {
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
      <BlogListSection />
    </div>
  );
};

export default BlogPage;
