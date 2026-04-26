import Head from 'next/head';
import { addQueryParam, useLatestUtmParams } from '@bluedot/ui';
import { appendPosthogSessionIdPrefill } from '../../lib/appendPosthogSessionIdPrefill';
import { Nav } from '../Nav/Nav';
import TestimonialCarousel, { type TestimonialMember } from './TestimonialCarousel';
import GraduateSection from './components/GraduateSection';
import PartnerSection, { type PartnerSectionProps } from './components/PartnerSection';
import CourseBenefitsSection, { type CourseBenefitsSectionProps } from './components/CourseBenefitsSection';
import WhoIsThisForSection, { type WhoIsThisForSectionProps } from './components/WhoIsThisForSection';
import WhoIsThisForTextSection, { type WhoIsThisForTextSectionProps } from './components/WhoIsThisForTextSection';
import CourseBenefitsTextSection, { type CourseBenefitsTextSectionProps } from './components/CourseBenefitsTextSection';
import PathwaysListSection, { type PathwaysListSectionProps } from './components/PathwaysListSection';
import ScheduleListSection, { type ScheduleListSectionProps } from './components/ScheduleListSection';
import HowTheCourseWorksSection, { type HowTheCourseWorksSectionProps } from './components/HowTheCourseWorksSection';
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
import FieldBuildingSection, { type FieldBuildingSectionProps } from './components/FieldBuildingSection';
import { trpc } from '../../utils/trpc';

export type CourseLanderMeta = {
  title: string;
  /** Falls back to hero.description if not provided */
  description?: string;
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
  /** Editorial text variant of "Who this course is for" — paragraphs, no icon cards */
  whoIsThisForText?: WhoIsThisForTextSectionProps;
  /** Detailed personas section - alternative to whoIsThisFor for longer-form content */
  personas?: PersonasSectionProps;
  courseBenefits?: CourseBenefitsSectionProps;
  /** Editorial text variant of "How this course will benefit you" — heading + paragraph pairs, no icons */
  courseBenefitsText?: CourseBenefitsTextSectionProps;
  /** Course outcomes section - alternative to courseBenefits for text-focused content */
  courseOutcomes?: CourseOutcomesSectionProps;
  /** Optional placement override for course outcomes section */
  courseOutcomesPlacement?: 'default' | 'beforeStructure';
  /** Prerequisites section */
  prerequisites?: PrerequisitesSectionProps;
  courseInformation?: CourseInformationSectionProps;
  /** Editorial prose "How the course works" — replaces courseInformation when set. Renders paragraphs with course-round unit counts interpolated from the database. */
  howTheCourseWorks?: HowTheCourseWorksSectionProps;
  /** Standalone schedule section using PageListRow rows — renders alongside howTheCourseWorks instead of inside courseInformation's box. */
  scheduleList?: ScheduleListSectionProps;
  /** Case studies / alumni stories section */
  caseStudies?: CaseStudiesSectionProps;
  /** Alumni story carousel - carousel with full story text */
  alumniStories?: AlumniStoryCarouselProps;
  pathways?: PathwaysSectionProps;
  /** Editorial list variant of "What happens after" — PageListRow rows like /programs and /events */
  pathwaysList?: PathwaysListSectionProps;
  quotes?: QuoteSectionProps;
  testimonials?: TestimonialMember[];
  testimonialsTitle?: string;
  /** Hide the testimonials section even if testimonials exist in the database */
  hideTestimonials?: boolean;
  /** Optional placement override for testimonials section */
  testimonialsPlacement?: 'default' | 'beforeOutcomes';
  partners?: PartnerSectionProps;
  /** Optional recruiting / field-building section shown before FAQ */
  fieldBuilding?: FieldBuildingSectionProps;
  faq?: FAQSectionProps;
  banner: LandingBannerProps;
};

type CourseLanderProps = {
  courseSlug: string;
  baseApplicationUrl?: string;
  createContentFor: (applicationUrlWithUtm: string, courseSlug: string) => CourseLanderContent;
  courseOgImage: string;
  soonestDeadline: string | null;
  canonicalPath?: string;
};

const CourseLander = ({
  courseSlug, baseApplicationUrl, createContentFor, courseOgImage, soonestDeadline, canonicalPath,
}: CourseLanderProps) => {
  const { latestUtmParams } = useLatestUtmParams();

  const safeBaseApplicationUrl = baseApplicationUrl ?? '';
  const applicationUrlWithUtm = appendPosthogSessionIdPrefill(latestUtmParams.utm_source && safeBaseApplicationUrl
    ? addQueryParam(safeBaseApplicationUrl, 'prefill_Source', latestUtmParams.utm_source)
    : safeBaseApplicationUrl);

  const content = createContentFor(applicationUrlWithUtm, courseSlug);
  // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
  const seoDescription = content.meta.description || content.hero.description;

  const { data: dbTestimonials } = trpc.testimonials.getCommunityMembersByCourseSlug.useQuery({ courseSlug });

  const testimonials = dbTestimonials?.map((t): TestimonialMember => ({ ...t }));
  const shouldShowTestimonials = Boolean(testimonials && testimonials.length > 0 && !content.hideTestimonials);
  const testimonialsSection = shouldShowTestimonials ? (
    <>
      <div className="border-t-hairline border-color-divider" />
      <TestimonialCarousel
        testimonials={testimonials ?? []}
        title={content.testimonialsTitle}
        variant="lander"
      />
    </>
  ) : null;

  const ctaText = soonestDeadline
    ? `Apply by ${soonestDeadline}`
    : content.hero.primaryCta.text;
  const ogUrl = `https://bluedot.org${canonicalPath ?? `/courses/${encodeURIComponent(courseSlug)}`}`;

  const heroProps = {
    ...content.hero,
    primaryCta: {
      ...content.hero.primaryCta,
      text: ctaText,
    },
  };

  return (
    <div className="relative bg-white">
      <Head>
        <title>{content.meta.title}</title>
        <meta name="description" content={seoDescription} />

        {/* Open Graph meta tags */}
        <meta property="og:title" content={content.meta.title} />
        <meta property="og:description" content={seoDescription} />
        <meta property="og:image" content={courseOgImage} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:image:alt" content={content.meta.title} />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="BlueDot Impact" />
        <meta property="og:url" content={ogUrl} />

        {/* Twitter Card meta tags */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={content.meta.title} />
        <meta name="twitter:description" content={seoDescription} />
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

      {/* Personas / editorial "Who is this for" / standard icon-card "Who is this for" */}
      {content.personas && <PersonasSection id="personas" {...content.personas} />}
      {!content.personas && content.whoIsThisForText && <WhoIsThisForTextSection {...content.whoIsThisForText} />}
      {!content.personas && !content.whoIsThisForText && content.whoIsThisFor && <WhoIsThisForSection {...content.whoIsThisFor} />}

      {content.testimonialsPlacement === 'beforeOutcomes' && testimonialsSection}

      {/* Course outcomes OR course benefits section */}
      {content.courseOutcomes && content.courseOutcomesPlacement !== 'beforeStructure' && (
        <>
          <div className="border-t-hairline border-color-divider" />
          <CourseOutcomesSection id="outcomes" {...content.courseOutcomes} />
        </>
      )}

      {/* Editorial "How this course will benefit you" renders BEFORE pathways
          so the page reads value-then-next-steps. The icon-card variant
          (`courseBenefits`) keeps its original after-pathways slot below
          to avoid changing other course pages. */}
      {content.courseBenefitsText && (
        <>
          <div className="border-t-hairline border-color-divider" />
          <CourseBenefitsTextSection {...content.courseBenefitsText} />
        </>
      )}

      {/* Pathways - what happens after */}
      {content.pathwaysList && (
        <>
          <div className="border-t-hairline border-color-divider" />
          <PathwaysListSection id="pathways" {...content.pathwaysList} />
        </>
      )}
      {!content.pathwaysList && content.pathways && (
        <>
          <div className="border-t-hairline border-color-divider" />
          <PathwaysSection id="pathways" {...content.pathways} />
        </>
      )}

      {!content.courseBenefitsText && content.courseBenefits && (
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

      {content.courseOutcomes && content.courseOutcomesPlacement === 'beforeStructure' && (
        <>
          <div className="border-t-hairline border-color-divider" />
          <CourseOutcomesSection id="outcomes" {...content.courseOutcomes} />
        </>
      )}

      {/* Editorial "How the course works" + standalone Schedule replace
          the boxed CourseInformationSection when set. */}
      {content.howTheCourseWorks && (
        <>
          <div className="border-t-hairline border-color-divider" />
          <HowTheCourseWorksSection id="structure" {...content.howTheCourseWorks} />
        </>
      )}
      {content.scheduleList && (
        <>
          <div className="border-t-hairline border-color-divider" />
          <ScheduleListSection id="schedule" {...content.scheduleList} />
        </>
      )}
      {!content.howTheCourseWorks && !content.scheduleList && content.courseInformation && (
        <>
          <div className="border-t-hairline border-color-divider" />
          <CourseInformationSection id="structure" {...content.courseInformation} />
        </>
      )}

      {content.testimonialsPlacement !== 'beforeOutcomes' && testimonialsSection}

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

      {content.fieldBuilding && (
        <>
          <div className="border-t-hairline border-color-divider" />
          <FieldBuildingSection id="help-build-field" {...content.fieldBuilding} />
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
