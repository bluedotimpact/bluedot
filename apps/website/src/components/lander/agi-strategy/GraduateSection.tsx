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
    <section className="graduate-section w-full max-w-max-width mx-auto px-spacing-x py-8 overflow-hidden flex flex-col">
      <div className="flex flex-col lg:flex-row gap-6 items-center">
        <div className="flex flex-col lg:flex-row lg:items-center gap-4 lg:gap-2 shrink-0 items-center">
          <FaceTiles faces={faces} />
          <P className="flex-shrink-0 text-center lg:text-left">Our 4000+ alumni shape AI's future at:</P>
        </div>
        <div className="w-full inline-flex flex-nowrap overflow-hidden justify-center lg:justify-start [mask-image:_linear-gradient(to_right,transparent_0,_black_128px,_black_calc(100%-200px),transparent_100%)]">
          <ul className="flex items-center justify-center lg:justify-start [&_li]:mx-8 [&_img]:max-w-none animate-infinite-scroll list-none">
            {logos.map((logo) => (
              <li key={logo.src}><img className={clsx('h-6', logo.customClassName)} src={logo.src} alt={logo.alt} /></li>
            ))}
          </ul>
          <ul className="flex items-center justify-center lg:justify-start [&_li]:mx-8 [&_img]:max-w-none animate-infinite-scroll list-none" aria-hidden="true">
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
