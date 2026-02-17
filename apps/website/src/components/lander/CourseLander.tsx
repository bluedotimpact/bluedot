import Head from 'next/head';
import { addQueryParam, useLatestUtmParams } from '@bluedot/ui';
import { appendPosthogSessionIdPrefill } from '../../lib/appendPosthogSessionIdPrefill';
import { Nav } from '../Nav/Nav';
import TestimonialCarousel, { type TestimonialMember } from './TestimonialCarousel';
import GraduateSection from './components/GraduateSection';
import PartnerSection, { type PartnerSectionProps } from './components/PartnerSection';
import CourseBenefitsSection, { type CourseBenefitsSectionProps } from './components/CourseBenefitsSection';
import WhoIsThisForSection, { type WhoIsThisForSectionProps } from './components/WhoIsThisForSection';
import HeroSection, { type HeroSectionProps } from './components/HeroSection';
import QuoteSection, { type QuoteSectionProps } from './components/QuoteSection';
import CourseInformationSection, { type CourseInformationSectionProps } from './components/CourseInformationSection';
import FAQSection, { type FAQSectionProps } from './components/FAQSection';
import LandingBanner, { type LandingBannerProps } from './components/LandingBanner';
import PathwaysSection, { type PathwaysSectionProps } from './components/PathwaysSection';
import AlumniLogosSection, { type AlumniLogosSectionProps } from './components/AlumniLogosSection';
import PersonasSection, { type PersonasSectionProps } from './components/PersonasSection';
import CourseOutcomesSection, { type CourseOutcomesSectionProps } from './components/CourseOutcomesSection';
import PrerequisitesSection, { type PrerequisitesSectionProps } from './components/PrerequisitesSection';
import CaseStudiesSection, { type CaseStudiesSectionProps } from './components/CaseStudiesSection';
import AlumniStoryCarousel, { type AlumniStoryCarouselProps } from './components/AlumniStoryCarousel';
import SectionNav, { type SectionNavItem } from './components/SectionNav';
import { trpc } from '../../utils/trpc';

export type CourseLanderMeta = {
  title: string;
  description: string;
};

export type CourseLanderContent = {
  meta: CourseLanderMeta;
  hero: HeroSectionProps;
  /** Section navigation items - if provided, shows a sticky nav */
  sectionNav?: SectionNavItem[];
  /** Alumni logos section - if provided, replaces GraduateSection */
  alumniLogos?: AlumniLogosSectionProps;
  /** Standard "Who is this for" section with icon cards */
  whoIsThisFor?: WhoIsThisForSectionProps;
  /** Detailed personas section - alternative to whoIsThisFor for longer-form content */
  personas?: PersonasSectionProps;
  courseBenefits?: CourseBenefitsSectionProps;
  /** Course outcomes section - alternative to courseBenefits for text-focused content */
  courseOutcomes?: CourseOutcomesSectionProps;
  /** Prerequisites section */
  prerequisites?: PrerequisitesSectionProps;
  courseInformation?: CourseInformationSectionProps;
  /** Case studies / alumni stories section */
  caseStudies?: CaseStudiesSectionProps;
  /** Alumni story carousel - carousel with full story text */
  alumniStories?: AlumniStoryCarouselProps;
  pathways?: PathwaysSectionProps;
  quotes?: QuoteSectionProps;
  testimonials?: TestimonialMember[];
  testimonialsTitle?: string;
  partners?: PartnerSectionProps;
  faq?: FAQSectionProps;
  banner: LandingBannerProps;
};

type CourseLanderProps = {
  courseSlug: string;
  baseApplicationUrl: string;
  createContentFor: (applicationUrlWithUtm: string, courseSlug: string) => CourseLanderContent;
  courseOgImage: string;
  soonestDeadline: string | null;
};

const CourseLander = ({
  courseSlug, baseApplicationUrl, createContentFor, courseOgImage, soonestDeadline,
}: CourseLanderProps) => {
  const { latestUtmParams } = useLatestUtmParams();

  const applicationUrlWithUtm = appendPosthogSessionIdPrefill(latestUtmParams.utm_source
    ? addQueryParam(baseApplicationUrl, 'prefill_Source', latestUtmParams.utm_source)
    : baseApplicationUrl);

  const content = createContentFor(applicationUrlWithUtm, courseSlug);

  const { data: dbTestimonials } = trpc.testimonials.getCommunityMembersByCourseSlug.useQuery({ courseSlug });

  const testimonials = dbTestimonials?.map((t): TestimonialMember => ({ ...t }));

  const ctaText = soonestDeadline
    ? `Apply by ${soonestDeadline}`
    : content.hero.primaryCta.text;

  const heroProps = {
    ...content.hero,
    primaryCta: {
      ...content.hero.primaryCta,
      text: ctaText,
    },
  };

  return (
    <div className="bg-white">
      <Head>
        <title>{content.meta.title}</title>
        <meta name="description" content={content.meta.description} />

        {/* Open Graph meta tags */}
        <meta property="og:title" content={content.meta.title} />
        <meta property="og:description" content={content.meta.description} />
        <meta property="og:image" content={courseOgImage} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:image:alt" content={content.meta.title} />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="BlueDot Impact" />
        <meta property="og:url" content={`https://bluedot.org/courses/${encodeURIComponent(courseSlug)}`} />

        {/* Twitter Card meta tags */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={content.meta.title} />
        <meta name="twitter:description" content={content.meta.description} />
        <meta name="twitter:image" content={courseOgImage} />
      </Head>

      <Nav variant={heroProps.gradient ? 'transparent' : 'default'} />
      {content.sectionNav && <SectionNav sections={content.sectionNav} applyUrl={heroProps.primaryCta?.url} />}
      <HeroSection {...heroProps} />

      <div className="border-t-hairline border-color-divider" />

      {/* Alumni logos section OR default graduate section */}
      {content.alumniLogos ? (
        <AlumniLogosSection {...content.alumniLogos} />
      ) : (
        <GraduateSection />
      )}

      <div className="border-t-hairline border-color-divider" />

      {/* Personas section OR standard "Who is this for" section */}
      {content.personas && <PersonasSection id="personas" {...content.personas} />}
      {!content.personas && content.whoIsThisFor && <WhoIsThisForSection {...content.whoIsThisFor} />}

      {/* Course outcomes OR course benefits section */}
      {content.courseOutcomes && (
        <>
          <div className="border-t-hairline border-color-divider" />
          <CourseOutcomesSection id="outcomes" {...content.courseOutcomes} />
        </>
      )}

      {/* Pathways - what happens after (placed right after outcomes for unified "what you're joining" feel) */}
      {content.pathways && (
        <>
          <div className="border-t-hairline border-color-divider" />
          <PathwaysSection id="pathways" {...content.pathways} />
        </>
      )}

      {content.courseBenefits && (
        <>
          <div className="border-t-hairline border-color-divider" />
          <CourseBenefitsSection {...content.courseBenefits} />
        </>
      )}

      {/* Prerequisites section */}
      {content.prerequisites && (
        <>
          <div className="border-t-hairline border-color-divider" />
          <PrerequisitesSection id="prerequisites" {...content.prerequisites} />
        </>
      )}

      {/* Alumni story carousel */}
      {content.alumniStories && (
        <>
          <div className="border-t-hairline border-color-divider" />
          <AlumniStoryCarousel {...content.alumniStories} />
        </>
      )}

      {/* Case studies section */}
      {content.caseStudies && (
        <>
          <div className="border-t-hairline border-color-divider" />
          <CaseStudiesSection {...content.caseStudies} />
        </>
      )}

      {content.courseInformation && (
        <>
          <div className="border-t-hairline border-color-divider" />
          <CourseInformationSection id="structure" {...content.courseInformation} />
        </>
      )}

      {testimonials && (
        <>
          <div className="border-t-hairline border-color-divider" />
          <TestimonialCarousel
            testimonials={testimonials}
            title={content.testimonialsTitle}
            variant="lander"
          />
        </>
      )}

      {content.quotes && (
        <>
          <div className="border-t-hairline border-color-divider" />
          <QuoteSection {...content.quotes} />
        </>
      )}

      {content.partners && (
        <>
          <div className="border-t-hairline border-color-divider" />
          <PartnerSection {...content.partners} />
        </>
      )}

      {content.faq && (
        <>
          <div className="border-t-hairline border-color-divider" />
          <FAQSection id="faq" {...content.faq} />
        </>
      )}

      <LandingBanner {...content.banner} />
    </div>
  );
};

export default CourseLander;
