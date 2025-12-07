import clsx from 'clsx';
import { P } from '@bluedot/ui/src/Text';

const logos = [
  { src: '/images/third-party-logos/openai.svg', alt: 'OpenAI' },
  { src: '/images/third-party-logos/anthropic.svg', alt: 'Anthropic', customClassName: '!h-3' },
  { src: '/images/third-party-logos/deepmind.svg', alt: 'Google DeepMind' },
  { src: '/images/third-party-logos/aisi.png', alt: 'AI Security Institute' },
  { src: '/images/third-party-logos/un.png', alt: 'United Nations' },
  { src: '/images/third-party-logos/amnesty.png', alt: 'Amnesty International' },
  { src: '/images/third-party-logos/time.png', alt: 'Time' },
  { src: '/images/third-party-logos/nato.png', alt: 'NATO' },
  { src: '/images/third-party-logos/oecd.png', alt: 'OECD' },
  { src: '/images/third-party-logos/hai.png', alt: 'Stanford HAI' },
  { src: '/images/third-party-logos/apple.png', alt: 'Apple' },
  { src: '/images/third-party-logos/harvard.png', alt: 'Harvard Kennedy School' },
];

const GraduateSection = () => {
  return (
    <section className="w-full h-[106px] min-[680px]:h-[91px] bg-white flex items-center">
      <div className="w-full flex items-center justify-center 2xl:justify-end p-5 sm:px-6 md:px-12 2xl:pl-[272px] 2xl:pr-[48px]">
        {/* Container with text and logos */}
        <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-5 w-full max-w-[1200px] 2xl:max-w-none">
          {/* Text */}
          <P className="text-[#13132E] text-[16px] leading-[26px] whitespace-nowrap flex-shrink-0">
            Our 6,000+ alumni work at
          </P>

          {/* Logos with scrolling */}
          <div className="w-full sm:flex-1 inline-flex flex-nowrap overflow-hidden [mask-image:_linear-gradient(90deg,transparent_0,_black_12.63%,_black_80.26%,transparent_100%)]">
            <ul className="flex items-center justify-start [&_li]:mx-8 [&_img]:max-w-none animate-infinite-scroll list-none">
              {logos.map((logo) => (
                <li key={logo.src}>
                  <img className={clsx('h-6', logo.customClassName)} src={logo.src} alt={logo.alt} />
                </li>
              ))}
            </ul>
            <ul className="flex items-center justify-start [&_li]:mx-8 [&_img]:max-w-none animate-infinite-scroll list-none" aria-hidden="true">
              {logos.map((logo) => (
                <li key={logo.src}>
                  <img className={clsx('h-6', logo.customClassName)} src={logo.src} alt={logo.alt} />
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
};

export default GraduateSection;
