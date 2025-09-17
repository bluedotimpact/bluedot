import { NewText } from '@bluedot/ui';
import { PiRocketLaunch, PiUsersThree, PiHandCoins } from 'react-icons/pi';

const { H2, H3, P } = NewText;

const valueCards = [
  {
    icon: <PiRocketLaunch className="text-black" size={28} />,
    title: 'Take action in less than 30 hours',
    description: "You don't need another degree. This AGI Strategy course replaces years of self-study with three frameworks: incentive mapping to understand the AGI race, kill chains to analyse AI threats, and defence-in-depth to design interventions that counter them. You'll finish with a fundable plan.",
  },
  {
    icon: <PiUsersThree className="text-black" size={28} />,
    title: 'Join a network of builders',
    description: "This course isn't for everyone. We're building a community of people who are energised to take ambitious actions to make AI go well, including starting new companies, policy entrepreneurship, and high-impact research bets. Completing this course will give you access to this community.",
  },
  {
    icon: <PiHandCoins className="text-black" size={28} />,
    title: 'Get funded to accelerate your impact',
    description: "If your final course proposal is strong, you'll receive $10-50k to kickstart your transition into impactful work, and you'll be invited to co-work with us in London for 1-2 weeks. We'll do whatever it takes to accelerate your journey.",
  },
];

const WhyTakeThisCourseSection = () => {
  return (
    <section className="w-full bg-white">
      <div className="max-w-max-width mx-auto px-spacing-x py-16">
        <H2 className="text-[28px] md:text-[32px] lg:text-[36px] font-semibold leading-[125%] text-[#13132E] text-center mb-16 tracking-[-0.01em]">
          How this course will benefit you
        </H2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {valueCards.map(({ icon, title, description }) => (
            <div key={title} className="flex flex-col gap-6">
              <div className="size-14 bg-[#ECF0FF] rounded-lg flex items-center justify-center flex-shrink-0">
                {icon}
              </div>
              <div className="space-y-2">
                <H3 className="text-[18px] font-semibold leading-tight text-[#13132E]">
                  {title}
                </H3>
                <P className="text-size-sm leading-[1.6] text-[#13132E] opacity-80">
                  {description}
                </P>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default WhyTakeThisCourseSection;
