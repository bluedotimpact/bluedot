import { Section, SectionHeading } from '@bluedot/ui';
import { P } from '../Text';

const CultureSection = () => {
  return (
    <Section className="culture-section">
      <div className="culture-section__container flex lg:flex-row flex-col gap-space-between">
        <div className="culture-section__text-container flex flex-col gap-5 max-w-[436px]">
          <SectionHeading title="Our culture" />
          <P>At BlueDot Impact, our culture is defined by high agency, rapid experimentation, and direct feedback. We move fast and iterate quickly because AI capabilities are advancing rapidly and our work is time-sensitive.</P>
          <P>But speed doesn't mean sacrificing support – we invest heavily in each other's growth and wellbeing, creating an environment where ambitious, mission-driven people can do their best work.</P>
          <P>We seek exceptional people who combine a sense of urgency with the empathy to help others thrive, whether that's fellow team members or the thousands of professionals in our global community.</P>
        </div>
        <div className="culture-section__image-grid grid mt-6 grid-cols-2 gap-x-2 gap-y-4 sm:mt-0 sm:grid-cols-3 sm:gap-4">
          <img className="culture-section__image max-h-[100px] sm:max-h-[178px] w-full object-cover rounded-sm" src="/images/culture/culture_dewi_v1.jpeg" alt="BlueDot Impact team" />
          <img className="culture-section__image max-h-[100px] sm:max-h-[178px] w-full object-cover rounded-sm" src="/images/culture/culture_talking_v2.jpeg" alt="BlueDot Impact team" />
          <img className="culture-section__image max-h-[100px] sm:max-h-[178px] w-full object-cover rounded-sm" src="/images/culture/culture_cap_v1.jpeg" alt="BlueDot Impact team" />
          <img className="culture-section__image max-h-[100px] sm:max-h-[178px] w-full object-cover rounded-sm" src="/images/culture/culture_will_v1.jpeg" alt="BlueDot Impact team" />
          <img className="culture-section__image max-h-[100px] sm:max-h-[178px] w-full object-cover rounded-sm" src="/images/culture/culture_josh_v1.jpg" alt="BlueDot Impact team" />
          <img className="culture-section__image max-h-[100px] sm:max-h-[178px] w-full object-cover rounded-sm" src="/images/culture/culture_keyboard_v1.jpeg" alt="BlueDot Impact team" />
        </div>
      </div>
    </Section>
  );
};

export default CultureSection;
