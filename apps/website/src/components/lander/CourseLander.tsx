import Head from 'next/head';
import { addQueryParam, useLatestUtmParams } from '@bluedot/ui';
import CommunityMembersSubSection, { CommunityMember } from './components/CommunityMembersSubSection';
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
  curriculum: CourseCurriculumSectionProps;
  courseBenefits: CourseBenefitsSectionProps;
  courseInformation: CourseInformationSectionProps;
  quotes: QuoteSectionProps;
  communityMembers: CommunityMember[];
  partners?: PartnerSectionProps;
  faq: FAQSectionProps;
  banner: LandingBannerProps;
};

type CourseLanderProps = {
  courseSlug: string;
  baseApplicationUrl: string;
  createContentFor: (applicationUrlWithUtm: string, courseSlug: string) => CourseLanderContent;
};

const CourseLander = ({ courseSlug, baseApplicationUrl, createContentFor }: CourseLanderProps) => {
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
      </Head>

      <HeroSection {...content.hero} />

      <div className="border-t-hairline border-color-divider" />

      <GraduateSection />

      <WhoIsThisForSection {...content.whoIsThisFor} />

      <CourseCurriculumSection {...content.curriculum} />

      <CourseBenefitsSection {...content.courseBenefits} />

      <CourseInformationSection {...content.courseInformation} />

      <QuoteSection {...content.quotes} />

      <CommunityMembersSubSection members={content.communityMembers} />

      {content.partners && <PartnerSection {...content.partners} />}

      <FAQSection {...content.faq} />

      <LandingBanner {...content.banner} />
    </div>
  );
};

export default CourseLander;
