import { H4, P, Section } from '@bluedot/ui';
import { PiShieldStarLight, PiShootingStarLight, PiUsersThreeLight } from 'react-icons/pi';

const Header = () => (
  <div className="flex flex-col items-center gap-8 max-w-4xl mx-auto text-center">
    <div className="flex flex-col gap-5">
      <h2
        className="text-size-xl font-medium leading-snug text-bluedot-navy tracking-tighter"
        style={{ fontFeatureSettings: '\'ss04\' on' }}
      >
        Start making an impact today
      </h2>
      <P className="text-size-sm md:text-size-md leading-relaxed opacity-70 max-w-4xl">
        Do you want to help build an awesome, safe future with AI? Apply to one of our free courses today.
        We'll help you ensure that humanity safely navigates the transition to transformative AI.
      </P>
    </div>
  </div>
);

const ValueProp = ({ iconType, title, description }: { iconType: 'career' | 'network' | 'expert'; title: string; description: string }) => {
  let IconComponent;
  if (iconType === 'career') {
    IconComponent = PiShieldStarLight;
  } else if (iconType === 'network') {
    IconComponent = PiShootingStarLight;
  } else {
    IconComponent = PiUsersThreeLight;
  }

  return (
    <div className="flex flex-col gap-6 bd-md:basis-0 bd-md:grow">
      <div className="size-16 rounded-full bg-bluedot-navy/8 flex items-center justify-center">
        <IconComponent className="size-8 text-bluedot-navy" />
      </div>
      <div className="flex flex-col gap-2">
        <H4 className="text-size-md font-medium">{title}</H4>
        <P className="text-size-sm opacity-80">{description}</P>
      </div>
    </div>
  );
};

const ValueProps = () => (
  <div className="flex flex-col bd-md:flex-row justify-center gap-8 bd-md:gap-0 max-w-screen-xl mx-auto w-full">
    <ValueProp
      iconType="career"
      title="Build a career in AI safety, fast"
      description="25% of our graduates land impactful roles within six months of completing a course."
    />
    <div className="h-px bd-md:h-auto bd-md:w-px bg-bluedot-navy/20 bd-md:mx-8" />
    <ValueProp
      iconType="network"
      title="Get recognised in the industry"
      description="Hiring managers at all the major AI companies and governments recruit from our community."
    />
    <div className="h-px bd-md:h-auto bd-md:w-px bg-bluedot-navy/20 bd-md:mx-8" />
    <ValueProp
      iconType="expert"
      title="Join a growing global community"
      description="We host remote and in-person events all over the world every week."
    />
  </div>
);

const CourseValueProps = () => (
  <Section className="py-12 md:py-16 lg:py-20 xl:py-24 px-5 bd-md:px-8 lg:px-12 xl:px-16 2xl:px-20">
    <div className="flex flex-col items-center gap-16 lg:gap-20 xl:gap-24 2xl:gap-[120px] max-w-screen-xl mx-auto">
      <Header />
      <ValueProps />
    </div>
  </Section>
);

export default CourseValueProps;
