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
import { GetCourseResponse } from '../../api/courses/[courseId]';

const CURRENT_ROUTE = ROUTES.coursesFutureOfAi;

const CoursePage = () => {
  const { query: { courseId } } = useRouter();

  const [{ data, loading }] = useAxios<GetCourseResponse>({
    method: 'get',
    url: `/api/courses/${courseId}`,
  });

  return (
    <div>
      {loading && <ProgressDots />}
      {data?.course && (
        <>
          <Head>
            <title>{data?.course.title} | BlueDot Impact</title>
            <meta name="description" content={data?.course.description} />
          </Head>
          <HeroSection>
            <HeroH1>{data.course.title}</HeroH1>
            <HeroH2>{data.course.description}</HeroH2>
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
