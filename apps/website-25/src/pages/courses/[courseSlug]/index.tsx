import {
  HeroSection,
  HeroCTAContainer,
  HeroH1,
  HeroH2,
  CTALinkOrButton,
  ProgressDots,
  Section,
  CourseCard,
} from '@bluedot/ui';
import Head from 'next/head';
import useAxios from 'axios-hooks';
import { useRouter } from 'next/router';
import { ROUTES } from '../../../lib/routes';
import { GetCourseResponse } from '../../api/courses/[courseSlug]';

const CoursePage = () => {
  const { query: { courseSlug } } = useRouter();

  const [{ data, loading }] = useAxios<GetCourseResponse>({
    method: 'get',
    url: `/api/courses/${courseSlug}`,
  });

  return (
    <div>
      {loading && <ProgressDots />}
      {/* TODO: error page */}
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
          <Section
            className="course-serp"
          >
            {loading && <ProgressDots />}
            <div className="course-serp__content grid sm:grid-cols-2 lg:grid-cols-4 gap-space-between items-stretch">
              {/* Units must be sorted to ensure correct order */}
              {data?.units?.sort((a, b) => Number(a.unitNumber) - Number(b.unitNumber)).map((unit) => (
                <div className="max-w-[350px]">
                  <CourseCard
                    key={unit.unitNumber}
                    title={`Unit ${unit.unitNumber}: ${unit.title}`}
                    href={unit.path}
                    courseType="Self-paced"
                    courseLength={`${unit.duration} mins`}
                  />
                </div>
              ))}
            </div>
          </Section>
        </>
      )}
    </div>
  );
};

export default CoursePage;
