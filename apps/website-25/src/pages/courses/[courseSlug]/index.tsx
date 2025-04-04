import {
  HeroSection,
  HeroCTAContainer,
  HeroH1,
  HeroH2,
  CTALinkOrButton,
  Breadcrumbs,
  ProgressDots,
} from '@bluedot/ui';
import Head from 'next/head';
import useAxios from 'axios-hooks';
import { useRouter } from 'next/router';
import { ROUTES } from '../../../lib/routes';
import { GetCoursesResponse } from '../../api/courses';

const CURRENT_ROUTE = ROUTES.coursesFutureOfAi;

const CoursePage = () => {
  const { query: { courseSlug } } = useRouter();

  const [{ data, loading }] = useAxios<GetCoursesResponse>({
    method: 'get',
    url: `/api/courses?courseTitle=${courseSlug}`,
  });

  return (
    <div>
      {loading && <ProgressDots />}
      {data?.courses[0] && (
        <>
          <Head>
            <title>{data?.courses[0].title} | BlueDot Impact</title>
            <meta name="description" content={data?.courses[0].description} />
          </Head>
          <HeroSection>
            <HeroH1>{data.courses[0].title}</HeroH1>
            <HeroH2>{data.courses[0].description}</HeroH2>
            <HeroCTAContainer>
              <CTALinkOrButton url={ROUTES.joinUs.url}>Start learning for free</CTALinkOrButton>
            </HeroCTAContainer>
          </HeroSection>
          <Breadcrumbs route={CURRENT_ROUTE} />
        </>
      )}
    </div>
  );
};

export default CoursePage;
