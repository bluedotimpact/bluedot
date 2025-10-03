import { NewText } from '@bluedot/ui';
import { PiBriefcase, PiCompass, PiFlask } from 'react-icons/pi';

const { H2, P } = NewText;

const targetAudiences = [
  {
    icon: <PiBriefcase className="text-white" size={28} />,
    boldText: 'For entrepreneurs and operators',
    normalText: ' who want to build solutions that protect humanity.',
  },
  {
    icon: <PiCompass className="text-white" size={28} />,
    boldText: 'For leaders',
    normalText: ' who want to steer AI\'s trajectory towards beneficial outcomes for humanity.',
  },
  {
    icon: <PiFlask className="text-white" size={28} />,
    boldText: 'For researchers',
    normalText: ' who want to take big bets on the most impactful research ideas.',
  },
];

const WhoIsThisForSection = () => {
  return (
    <section className="w-full bg-[#FAFAF7]">
      <div className="max-w-max-width mx-auto px-spacing-x py-12 md:pt-20 md:pb-16 lg:pt-24 lg:pb-20">
        <H2 className="text-[28px] min-[680px]:text-[32px] xl:text-[36px] font-semibold leading-[125%] text-[#13132E] text-center mb-12 md:mb-16 tracking-[-0.01em]">
          Who this course is for
        </H2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {targetAudiences.map(({ icon, boldText, normalText }) => (
            <div
              key={boldText}
              className="flex flex-col items-start gap-6 min-[1200px]:gap-0 min-[1200px]:justify-between bg-white border border-[rgba(19,19,46,0.1)] rounded-xl p-8 mx-auto md:mx-0 max-w-[350px] md:max-w-none min-[1200px]:h-[264px]"
            >
              <div className="size-14 bg-[#2244BB] rounded-lg flex items-center justify-center flex-shrink-0">
                {icon}
              </div>
              <P className="text-[18px] leading-[1.6] text-[#13132E]">
                <span className="font-semibold">{boldText}</span>
                <span>{normalText}</span>
              </P>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default WhoIsThisForSection;
