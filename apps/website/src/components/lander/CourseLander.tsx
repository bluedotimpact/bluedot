import Head from 'next/head';
import { addQueryParam, useLatestUtmParams } from '@bluedot/ui';
import CommunityMembersSubSection from './agi-strategy/CommunityMembersSubSection';
import GraduateSection from './agi-strategy/GraduateSection';
import PartnerSection from './agi-strategy/PartnerSection';
import CourseBenefitsSection from './agi-strategy/CourseBenefitsSection';
import WhoIsThisForSection from './agi-strategy/WhoIsThisForSection';
import HeroSection from './agi-strategy/HeroSection';
import QuoteSection from './agi-strategy/QuoteSection';
import CourseInformationSection from './agi-strategy/CourseInformationSection';
import CourseCurriculumSection from './agi-strategy/CourseCurriculumSection';
import FAQSection from './agi-strategy/FAQSection';
import AgiStrategyBanner from './agi-strategy/AgiStrategyBanner';
import { HeroSectionProps } from './agi-strategy/HeroSection';
import { WhoIsThisForSectionProps } from './agi-strategy/WhoIsThisForSection';
import { CourseCurriculumSectionProps } from './agi-strategy/CourseCurriculumSection';
import { CourseBenefitsSectionProps } from './agi-strategy/CourseBenefitsSection';
import { CourseInformationSectionProps } from './agi-strategy/CourseInformationSection';
import { QuoteSectionProps } from './agi-strategy/QuoteSection';
import { CommunityMember } from './agi-strategy/CommunityMembersSubSection';
import { PartnerSectionProps } from './agi-strategy/PartnerSection';
import { FAQSectionProps } from './agi-strategy/FAQSection';
import { AgiStrategyBannerProps } from './agi-strategy/AgiStrategyBanner';

export interface CourseLanderMeta {
  title: string;
  description: string;
}

export interface CourseLanderContent {
  applicationUrl: string;
  meta: CourseLanderMeta;
  hero: HeroSectionProps;
  whoIsThisFor: WhoIsThisForSectionProps;
  curriculum: CourseCurriculumSectionProps;
  courseBenefits: CourseBenefitsSectionProps;
  courseInformation: CourseInformationSectionProps;
  quotes: QuoteSectionProps;
  communityMembers: CommunityMember[];
  partners: PartnerSectionProps;
  faq: FAQSectionProps;
  banner: AgiStrategyBannerProps;
}

interface CourseLanderProps {
  courseSlug: string;
  createContentFor: (applicationUrlWithUtm: string, courseSlug: string) => CourseLanderContent;
}

const CourseLander = ({ courseSlug, createContentFor }: CourseLanderProps) => {
  const { latestUtmParams } = useLatestUtmParams();

  // First get content without UTM to access the base applicationUrl
  const baseContent = createContentFor('', courseSlug);

  const applicationUrlWithUtm = latestUtmParams.utm_source
    ? addQueryParam(baseContent.applicationUrl, 'prefill_Source', latestUtmParams.utm_source)
    : baseContent.applicationUrl;

  // Then get final content with UTM-enhanced URL
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

      <PartnerSection {...content.partners} />

      <FAQSection {...content.faq} />

      <AgiStrategyBanner {...content.banner} />
    </div>
  );
};

export default CourseLander;
