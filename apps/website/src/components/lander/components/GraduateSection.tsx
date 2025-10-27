import clsx from 'clsx';
import { P } from '@bluedot/ui/src/Text';
import { FaceTiles } from './FaceTiles';

const faces = [
  { src: '/images/graduates/matthew.png', alt: 'Matthew' },
  { src: '/images/graduates/sarah.png', alt: 'Sarah' },
  { src: '/images/graduates/kendrea.png', alt: 'Kendrea' },
];

const logos = [
  { src: '/images/third-party-logos/openai.svg', alt: 'OpenAI' },
  { src: '/images/third-party-logos/aisi.png', alt: 'AI Security Institute' },
  { src: '/images/third-party-logos/un.png', alt: 'United Nations' },
  { src: '/images/third-party-logos/anthropic.svg', alt: 'Anthropic', customClassName: '!h-3' },
  { src: '/images/third-party-logos/amnesty.png', alt: 'Amnesty International', customClassName: '' },
  { src: '/images/third-party-logos/time.png', alt: 'Time' },
  { src: '/images/third-party-logos/deepmind.svg', alt: 'Google DeepMind' },
  { src: '/images/third-party-logos/nato.png', alt: 'NATO' },
  { src: '/images/third-party-logos/oecd.png', alt: 'OECD' },
  { src: '/images/third-party-logos/hai.png', alt: 'Stanford University: Human Centered Artificial Intelligence Institute' },
  { src: '/images/third-party-logos/apple.png', alt: 'Apple' },
  { src: '/images/third-party-logos/harvard.png', alt: 'Harvard Kennedy School' },
];

const GraduateSection = () => {
  return (
    <section className="graduate-section w-full max-w-max-width mx-auto px-5 py-8 min-[680px]:px-8 min-[680px]:pt-8 min-[680px]:pb-[33px] min-[680px]:min-h-[105px] min-[1024px]:px-spacing-x overflow-hidden flex flex-col min-[680px]:justify-end min-[680px]:items-start">
      <div className="flex flex-col gap-6 items-center min-[680px]:flex-row min-[680px]:gap-6 min-[680px]:min-h-10 min-[680px]:items-center lg:flex-row">
        <div className="flex flex-col gap-4 items-center shrink-0 min-[680px]:flex-row min-[680px]:gap-4 min-[680px]:items-center lg:flex-row lg:items-center lg:gap-2">
          <FaceTiles faces={faces} />
          <P className="flex-shrink-0 text-center min-[680px]:text-left min-[680px]:min-w-[197px] min-[680px]:leading-tight lg:text-left lg:w-auto">
            Our 4000+ alumni work at
          </P>
        </div>
        <div className="w-full inline-flex flex-nowrap overflow-hidden justify-center min-[680px]:justify-start min-[680px]:flex-1 lg:justify-start [mask-image:_linear-gradient(to_right,transparent_0,_black_12.63%,_black_80.26%,transparent_100%)]">
          <ul className="flex items-center justify-center [&_li]:mx-8 [&_img]:max-w-none animate-infinite-scroll list-none min-[680px]:justify-start lg:justify-start">
            {logos.map((logo) => (
              <li key={logo.src}><img className={clsx('h-6', logo.customClassName)} src={logo.src} alt={logo.alt} /></li>
            ))}
          </ul>
          <ul className="flex items-center justify-center [&_li]:mx-8 [&_img]:max-w-none animate-infinite-scroll list-none min-[680px]:justify-start lg:justify-start" aria-hidden="true">
            {logos.map((logo) => (
              <li key={logo.src}><img className={clsx('h-6', logo.customClassName)} src={logo.src} alt={logo.alt} /></li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
};

export default GraduateSection;
