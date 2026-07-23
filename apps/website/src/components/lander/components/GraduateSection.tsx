import clsx from 'clsx';
import { P } from '@bluedot/ui';

const logos = [
  { src: '/images/third-party-logos/openai.svg', alt: 'OpenAI' },
  { src: '/images/third-party-logos/anthropic.svg', alt: 'Anthropic', customClassName: '!h-3' },
  { src: '/images/third-party-logos/deepmind.svg', alt: 'Google DeepMind' },
  { src: '/images/third-party-logos/aisi.webp', alt: 'AI Security Institute' },
  { src: '/images/third-party-logos/apollo.svg', alt: 'Apollo Research' },
  { src: '/images/third-party-logos/metr.svg', alt: 'METR' },
  { src: '/images/third-party-logos/redwood.svg', alt: 'Redwood Research' },
  { src: '/images/third-party-logos/meridian.svg', alt: 'Meridian Research Labs' },
  { src: '/images/third-party-logos/mats.svg', alt: 'MATS Research' },
  { src: '/images/third-party-logos/lisa.webp', alt: 'London Initiative for Safe AI' },
  { src: '/images/third-party-logos/talos.webp', alt: 'Talos Network' },
  { src: '/images/third-party-logos/un.webp', alt: 'United Nations' },
  { src: '/images/third-party-logos/amnesty.webp', alt: 'Amnesty International' },
  { src: '/images/third-party-logos/time.webp', alt: 'Time' },
  { src: '/images/third-party-logos/nato.webp', alt: 'NATO' },
  { src: '/images/third-party-logos/tbi.svg', alt: 'Tony Blair Institute' },
  { src: '/images/third-party-logos/hai.webp', alt: 'Stanford HAI' },
  { src: '/images/third-party-logos/apple.webp', alt: 'Apple' },
  { src: '/images/third-party-logos/harvard.webp', alt: 'Harvard Kennedy School' },
  { src: '/images/third-party-logos/securebio.webp', alt: 'SecureBio' },
  { src: '/images/third-party-logos/1day-sooner.webp', alt: '1Day Sooner' },
];

const GraduateSection = () => {
  return (
    <section className="w-full h-[106px] bd-md:h-[91px] bg-white flex items-center">
      {/* At 2xl viewports the alumni bar right-aligns with a 272px gap on the left so
        * the logo wall visually extends from a sibling element above. Bespoke layout —
        * not a candidate for the standard max-w-max-width container. Revisit with Cyrus
        * if the parent composition changes. */}
      <div className="w-full flex items-center justify-center 2xl:justify-end p-5 sm:px-6 md:px-12 2xl:pl-[272px] 2xl:pr-12">
        {/* Container with text and logos */}
        <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-5 w-full max-w-[1200px] 2xl:max-w-none">
          {/* Text */}
          <P className="text-bluedot-navy text-size-sm leading-relaxed whitespace-nowrap flex-shrink-0">
            Our 8,000+ alumni work at
          </P>

          {/* Logos with scrolling */}
          <div className="w-full sm:flex-1 inline-flex flex-nowrap overflow-hidden [mask-image:_linear-gradient(90deg,transparent_0,_black_12.63%,_black_80.26%,transparent_100%)]">
            <ul style={{ animationDuration: '35s' }} className="flex items-center justify-start [&_li]:mx-8 [&_img]:max-w-none animate-infinite-scroll list-none">
              {logos.map((logo) => (
                <li key={logo.src}>
                  {/* // Workaround for bug with camelcase `fetchPriority`: https://github.com/facebook/react/issues/25682 */}
                  <img className={clsx('h-6 grayscale opacity-80', logo.customClassName)} src={logo.src} alt={logo.alt} {...{ fetchpriority: 'high' }} />
                </li>
              ))}
            </ul>
            <ul style={{ animationDuration: '35s' }} className="flex items-center justify-start [&_li]:mx-8 [&_img]:max-w-none animate-infinite-scroll list-none" aria-hidden="true">
              {logos.map((logo) => (
                <li key={logo.src}>
                  {/* // Workaround for bug with camelcase `fetchPriority`: https://github.com/facebook/react/issues/25682 */}
                  <img className={clsx('h-6 grayscale opacity-80', logo.customClassName)} src={logo.src} alt={logo.alt} {...{ fetchpriority: 'high' }} />
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
