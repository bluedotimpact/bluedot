import { useState } from 'react';
import { CTALinkOrButton, H3, P } from '@bluedot/ui';

type Builder = {
  slug: string;
  founder: {
    name: string;
    profileUrl?: string;
  };
  program: {
    name: string;
    url: string;
  };
  logo: {
    src: string;
    alt: string;
  };
  before: string;
  after: string;
};

const BUILDERS: Builder[] = [
  {
    slug: 'mats',
    founder: {
      name: 'Ryan Kidd',
      profileUrl: 'https://www.linkedin.com/in/ryan-kidd-1b0574a3/',
    },
    program: { name: 'MATS', url: 'https://www.matsprogram.org/' },
    logo: { src: '/images/programs/fieldbuilder-week-founders/mats.svg', alt: 'MATS logo' },
    before: ' was a physics PhD and SERI MATS pilot participant who saw how the program could grow to meet the shortage of technical alignment researchers. He sent the organisers a plan to scale it and now co-leads ',
    after: '.',
  },
  {
    slug: 'horizon',
    founder: {
      name: 'Remco Zwetsloot',
      profileUrl: 'https://www.linkedin.com/in/remco-zwetsloot-90994142/',
    },
    program: { name: 'Horizon', url: 'https://horizonpublicservice.org/about-us/' },
    logo: { src: '/images/programs/fieldbuilder-week-founders/horizon.png', alt: 'Horizon Institute logo' },
    before: ' was a technical-policy researcher at CSET watching policy teams struggle to hire technical talent, so he started ',
    after: ' to bring them in.',
  },
  {
    slug: 'pibbss',
    founder: {
      name: 'Nora Ammann',
      profileUrl: 'https://www.linkedin.com/in/nora-ammann-329396139/',
    },
    program: { name: 'PIBBSS', url: 'https://princint.ai/' },
    logo: { src: '/images/programs/fieldbuilder-week-founders/pibbss.svg', alt: 'PIBBSS logo' },
    before: ' was a complex systems researcher at the Simon Institute, who saw that AI safety lacked diversity of expertise, so she co-founded ',
    after: ' to bring researchers from other fields in. She’s now a program director at ARIA.',
  },
  {
    slug: 'arena',
    founder: {
      name: 'Callum McDougall',
      profileUrl: 'https://www.perfectlynormal.co.uk/',
    },
    program: { name: 'ARENA', url: 'https://www.arena.education/' },
    logo: { src: '/images/programs/fieldbuilder-week-founders/arena.png', alt: 'ARENA logo' },
    before: ' was a Jane Street quant trying to break into AI safety research who built ',
    after: ' to help others technically upskill into the field. He’s now doing mech interp research at GDM.',
  },
  {
    slug: 'aisb',
    founder: {
      name: 'Pranav Gade',
      profileUrl: 'https://www.linkedin.com/in/pranav-gade/',
    },
    program: { name: 'AI Security Bootcamp', url: 'https://aisb.dev/' },
    logo: { src: '/images/programs/fieldbuilder-week-founders/aisb.svg', alt: 'AI Security Bootcamp logo' },
    before: ' was a research engineer at Conjecture, who saw security professionals had no clear path into AI safety, so he launched the ',
    after: ' to create one.',
  },
  {
    slug: 'ml4good',
    founder: {
      name: 'Charbel-Raphaël Segerie',
      profileUrl: 'https://www.linkedin.com/in/charbel-raphael-segerie/',
    },
    program: { name: 'ML4Good', url: 'https://ml4good.org/' },
    logo: { src: '/images/programs/fieldbuilder-week-founders/ml4good.svg', alt: 'ML4Good logo' },
    before: ' was an ML engineer who saw coding bootcamps work for the tech industry, and built ',
    after: ' to bring talent into AI safety in the same way.',
  },
];

const VISIBLE_COUNT = 3;

const styledLinkClass = 'font-semibold text-bluedot-navy underline underline-offset-2 hover:text-bluedot-normal';

const BuilderRow = ({ builder }: { builder: Builder }) => {
  return (
    <div className="grid grid-cols-1 bd-md:grid-cols-[140px_1fr] gap-5 bd-md:gap-12 py-7 bd-md:py-9 items-center border-t border-bluedot-navy/10 first:border-t-0">
      <a
        href={builder.program.url}
        target="_blank"
        rel="noreferrer"
        className="flex items-center justify-center w-[140px] h-[80px]"
        aria-label={`${builder.program.name} website`}
      >
        <img
          src={builder.logo.src}
          alt={builder.logo.alt}
          className="max-w-full max-h-full object-contain"
        />
      </a>
      <P className="text-size-md leading-relaxed text-bluedot-navy/80 max-w-[680px]">
        {builder.founder.profileUrl ? (
          <a
            href={builder.founder.profileUrl}
            target="_blank"
            rel="noreferrer"
            className={styledLinkClass}
          >
            {builder.founder.name}
          </a>
        ) : (
          <span className="font-semibold text-bluedot-navy">{builder.founder.name}</span>
        )}
        {builder.before}
        <a
          href={builder.program.url}
          target="_blank"
          rel="noreferrer"
          className={styledLinkClass}
        >
          {builder.program.name}
        </a>
        {builder.after}
      </P>
    </div>
  );
};

const FieldBuildersSection = () => {
  const [showAll, setShowAll] = useState(false);
  const visibleBuilders = showAll ? BUILDERS : BUILDERS.slice(0, VISIBLE_COUNT);
  const hiddenCount = BUILDERS.length - VISIBLE_COUNT;

  return (
    <section className="section section-body fieldbuilder-week-field-builders-section">
      <div className="w-full flex flex-col gap-7">
        <H3 className="max-w-[720px] text-balance">
          Most AI safety programs started because someone saw a talent gap and decided to do something about it.
        </H3>

        <div className="flex flex-col border-t border-b border-bluedot-navy/10">
          {visibleBuilders.map((builder) => (
            <BuilderRow key={builder.slug} builder={builder} />
          ))}
        </div>

        <div className="flex justify-center">
          <CTALinkOrButton
            variant="secondary"
            onClick={() => setShowAll((v) => !v)}
          >
            {showAll ? 'Show fewer' : `Show ${hiddenCount} more`}
          </CTALinkOrButton>
        </div>
      </div>
    </section>
  );
};

export default FieldBuildersSection;
