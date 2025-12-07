import Head from 'next/head';
import { addQueryParam, useLatestUtmParams } from '@bluedot/ui';
import CommunityCarousel, { CommunityMember } from './CommunityCarousel';
import GraduateSection from './components/GraduateSection';
import PartnerSection, { PartnerSectionProps } from './components/PartnerSection';
import CourseBenefitsSection, { CourseBenefitsSectionProps } from './components/CourseBenefitsSection';
import WhoIsThisForSection, { WhoIsThisForSectionProps } from './components/WhoIsThisForSection';
import HeroSection, { HeroSectionProps } from './components/HeroSection';
import QuoteSection, { QuoteSectionProps } from './components/QuoteSection';
import CourseInformationSection, { CourseInformationSectionProps } from './components/CourseInformationSection';
import CourseCurriculumSection, { CourseCurriculumSectionProps } from './components/CourseCurriculumSection';
import FAQSection, { FAQSectionProps } from './components/FAQSection';
import LandingBanner, { LandingBannerProps } from './components/LandingBanner';

export type CourseLanderMeta = {
  title: string;
  description: string;
};

export type CourseLanderContent = {
  meta: CourseLanderMeta;
  hero: HeroSectionProps;
  whoIsThisFor: WhoIsThisForSectionProps;
  curriculum?: CourseCurriculumSectionProps;
  courseBenefits?: CourseBenefitsSectionProps;
  courseInformation: CourseInformationSectionProps;
  quotes?: QuoteSectionProps;
  communityMembers?: CommunityMember[];
  communityMembersTitle?: string;
  partners?: PartnerSectionProps;
  faq?: FAQSectionProps;
  banner: LandingBannerProps;
};

type CourseLanderProps = {
  courseSlug: string;
  baseApplicationUrl: string;
  createContentFor: (applicationUrlWithUtm: string, courseSlug: string) => CourseLanderContent;
  courseOgImage?: string | null
};

const CourseLander = ({
  courseSlug, baseApplicationUrl, createContentFor, courseOgImage,
}: CourseLanderProps) => {
  const { latestUtmParams } = useLatestUtmParams();

  const applicationUrlWithUtm = latestUtmParams.utm_source
    ? addQueryParam(baseApplicationUrl, 'prefill_Source', latestUtmParams.utm_source)
    : baseApplicationUrl;

  const content = createContentFor(applicationUrlWithUtm, courseSlug);

  return (
    <div className="bg-white">
      <Head>
        <title>{content.meta.title}</title>
        <meta name="description" content={content.meta.description} />

        {/* Open Graph meta tags */}
        <meta property="og:title" content={content.meta.title} />
        <meta property="og:description" content={content.meta.description} />
        <meta property="og:image" content={courseOgImage || 'https://bluedot.org/images/logo/link-preview-fallback.png'} />
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
        <meta name="twitter:image" content={courseOgImage || 'https://bluedot.org/images/logo/link-preview-fallback.png'} />
      </Head>

      <HeroSection {...content.hero} />

      <div className="border-t-hairline border-color-divider" />

      <GraduateSection />

      <div className="border-t-hairline border-color-divider" />

      <WhoIsThisForSection {...content.whoIsThisFor} />

      {content.curriculum && (
        <>
          <div className="border-t-hairline border-color-divider" />
          <CourseCurriculumSection {...content.curriculum} />
        </>
      )}

      {content.courseBenefits && (
        <>
          <div className="border-t-hairline border-color-divider" />
          <CourseBenefitsSection {...content.courseBenefits} />
        </>
      )}

      <div className="border-t-hairline border-color-divider" />

      <CourseInformationSection {...content.courseInformation} />

      {content.quotes && (
        <QuoteSection {...content.quotes} />
      )}

      {content.communityMembers && (
        <>
          <div className="border-t-hairline border-color-divider" />
          <CommunityCarousel
            members={content.communityMembers}
            title={content.communityMembersTitle}
            variant="lander"
          />
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
          <FAQSection {...content.faq} />
        </>
      )}

      <LandingBanner {...content.banner} />
    </div>
  );
};

export default CourseLander;
