import {
  HeroSection,
  HeroCTAContainer,
  HeroH1,
  CTALinkOrButton,
  ProgressDots,
  Section,
  CourseCard,
  Breadcrumbs,
  ErrorSection,
} from '@bluedot/ui';
import Head from 'next/head';
import useAxios from 'axios-hooks';
import { useRouter } from 'next/router';
import { FaAward, FaStar, FaStopwatch } from 'react-icons/fa6';
import { ROUTES } from '../../../lib/routes';
import { GetCourseResponse } from '../../api/courses/[courseSlug]';
import { LandingPageContent } from '../../../components/lander/LandingPageBase';
import ClassicHero from '../../../components/lander/ClassicHero';
import MarkdownExtendedRenderer from '../../../components/courses/MarkdownExtendedRenderer';

const CoursePage = () => {
  const { query: { courseSlug } } = useRouter();

  if (typeof courseSlug !== 'string') {
    return 'Invalid course slug';
  }

  if (courseSlug === 'future-of-ai') {
    return <FutureOfAILander />;
  }

  return <StandardCoursePage courseSlug={courseSlug} />;
};

const FutureOfAILander = () => {
  const ctaUrl = `${ROUTES.courses.url}/future-of-ai/1`;

  return (
    <>
      <ClassicHero>
        <ClassicHero.Title>Future-proof your career</ClassicHero.Title>
        <ClassicHero.Subtitle>
          No jargon, no coding, no pre-requisites – just bring your curiosity for how AI will reshape your world.
        </ClassicHero.Subtitle>
        <HeroCTAContainer>
          <CTALinkOrButton url={ctaUrl}>Start learning for free</CTALinkOrButton>
        </HeroCTAContainer>
        <ClassicHero.Features>
          <ClassicHero.Feature icon={FaStar}>4.7/5 rating</ClassicHero.Feature>
          <ClassicHero.Feature icon={FaStopwatch}>2 hours</ClassicHero.Feature>
          <ClassicHero.Feature icon={FaAward}>Get certified</ClassicHero.Feature>
        </ClassicHero.Features>
      </ClassicHero>
      <LandingPageContent ctaUrl={ctaUrl} />
    </>
  );
};

const StandardCoursePage = ({ courseSlug }: { courseSlug: string }) => {
  const [{ data, loading, error }] = useAxios<GetCourseResponse>({
    method: 'get',
    url: `/api/courses/${courseSlug}`,
  });

  return (
    <div>
      {loading && <ProgressDots />}
      {error && <ErrorSection error={error} />}
      {data?.course && (
        <>
          <Head>
            <title>{data?.course.title} | BlueDot Impact</title>
            <meta name="description" content={data?.course.description} />
          </Head>
          <HeroSection>
            <HeroH1>{data.course.title}</HeroH1>
            <MarkdownExtendedRenderer className="invert my-8">{data.course.description}</MarkdownExtendedRenderer>
            {data.units?.[0]?.path && (
            <HeroCTAContainer>
              <CTALinkOrButton url={data.units[0].path}>Browse the curriculum for free</CTALinkOrButton>
            </HeroCTAContainer>
            )}
          </HeroSection>
          <Breadcrumbs
            className="course-serp__breadcrumbs"
            route={{
              title: data.course.title,
              url: data.course.path,
              parentPages: [ROUTES.home, ROUTES.courses],
            }}
          />
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
                    url={unit.path}
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
