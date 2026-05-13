import { useState } from 'react';
import { CTALinkOrButton, H3, P } from '@bluedot/ui';
import { pageSectionHeadingClass } from '../PageListRow';

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
  tint: string;
  credentialBefore: string;
  credentialAfter: string;
  story: string;
};

const BUILDERS: Builder[] = [
  {
    slug: 'mats',
    founder: {
      name: 'Ryan Kidd',
      profileUrl: 'https://www.linkedin.com/in/ryan-kidd-1b0574a3/',
    },
    program: { name: 'MATS', url: 'https://www.matsprogram.org/' },
    logo: { src: '/images/programs/builder-week-founders/mats.svg', alt: 'MATS logo' },
    tint: 'rgba(34, 83, 230, 0.08)',
    credentialBefore: 'Physics PhD doing independent alignment research at SERI, who co-founded ',
    credentialAfter: '.',
    story: 'He saw the shortage of excellent technical talent, and decided to build the pipeline.',
  },
  {
    slug: 'horizon',
    founder: {
      name: 'Remco Zwetsloot',
      profileUrl: 'https://www.linkedin.com/in/remco-zwetsloot-90994142/',
    },
    program: { name: 'Horizon', url: 'https://horizonpublicservice.org/about-us/' },
    logo: { src: '/images/programs/builder-week-founders/horizon.png', alt: 'Horizon Institute logo' },
    tint: 'rgba(58, 92, 196, 0.08)',
    credentialBefore: 'Technical-policy researcher at CSET, who started ',
    credentialAfter: '.',
    story: 'He watched policy teams struggle to hire technical talent, and built the program to bring them in.',
  },
  {
    slug: 'pibbss',
    founder: {
      name: 'Nora Ammann',
      profileUrl: 'https://www.linkedin.com/in/nora-ammann-329396139/',
    },
    program: { name: 'PIBBSS', url: 'https://princint.ai/' },
    logo: { src: '/images/programs/builder-week-founders/pibbss.svg', alt: 'PIBBSS logo' },
    tint: 'rgba(179, 71, 239, 0.08)',
    credentialBefore: 'Complex-systems researcher at the Simon Institute, who co-founded ',
    credentialAfter: '.',
    story: 'She saw AI safety lacked diversity of expertise, and built a way to bring researchers from other fields in. Now, program director at ARIA.',
  },
  {
    slug: 'arena',
    founder: {
      name: 'Callum McDougall',
      profileUrl: 'https://www.perfectlynormal.co.uk/',
    },
    program: { name: 'ARENA', url: 'https://www.arena.education/' },
    logo: { src: '/images/programs/builder-week-founders/arena.png', alt: 'ARENA logo' },
    tint: 'rgba(124, 27, 179, 0.08)',
    credentialBefore: 'Jane Street quant trying to break into AI safety research, who built ',
    credentialAfter: '.',
    story: 'He built the program he wished existed, to help others technically upskill into the field. Now, interp researcher at Google DeepMind.',
  },
  {
    slug: 'aisb',
    founder: {
      name: 'Pranav Gade',
      profileUrl: 'https://www.linkedin.com/in/pranav-gade/',
    },
    program: { name: 'AI Security Bootcamp', url: 'https://aisb.dev/' },
    logo: { src: '/images/programs/builder-week-founders/aisb.svg', alt: 'AI Security Bootcamp logo' },
    tint: 'rgba(46, 160, 28, 0.10)',
    credentialBefore: 'Research engineer at Conjecture, who launched the ',
    credentialAfter: '.',
    story: 'He saw security professionals had no clear path into AI safety, and created one.',
  },
  {
    slug: 'ml4good',
    founder: {
      name: 'Charbel-Raphaël Segerie',
      profileUrl: 'https://www.linkedin.com/in/charbel-raphael-segerie/',
    },
    program: { name: 'ML4Good', url: 'https://ml4good.org/' },
    logo: { src: '/images/programs/builder-week-founders/ml4good.svg', alt: 'ML4Good logo' },
    tint: 'rgba(212, 115, 15, 0.10)',
    credentialBefore: 'ML engineer who built ',
    credentialAfter: '.',
    story: 'He saw coding bootcamps work for the tech industry, and brought the same model to AI safety.',
  },
];

const VISIBLE_COUNT = 3;

const BuilderRow = ({ builder }: { builder: Builder }) => {
  const NameTag = builder.founder.profileUrl ? 'a' : 'span';
  const nameProps = builder.founder.profileUrl
    ? { href: builder.founder.profileUrl, target: '_blank' as const, rel: 'noreferrer' }
    : {};

  return (
    <div className="grid grid-cols-1 bd-md:grid-cols-[220px_1fr] gap-5 bd-md:gap-14 py-7 bd-md:py-9 items-center border-t border-bluedot-navy/10 first:border-t-0">
      <a
        href={builder.program.url}
        target="_blank"
        rel="noreferrer"
        className="flex items-center justify-center w-[220px] h-[130px]"
        aria-label={`${builder.program.name} website`}
      >
        <img
          src={builder.logo.src}
          alt={builder.logo.alt}
          className="max-w-full max-h-full object-contain"
        />
      </a>
      <div className="flex flex-col gap-2 max-w-[560px]">
        <NameTag
          {...nameProps}
          className={`text-size-lg font-bold text-bluedot-navy leading-tight ${
            builder.founder.profileUrl ? 'no-underline hover:text-bluedot-normal' : ''
          }`}
        >
          {builder.founder.name}
        </NameTag>
        <P className="text-size-sm leading-[1.55] text-bluedot-navy/80">
          {builder.credentialBefore}
          <a
            href={builder.program.url}
            target="_blank"
            rel="noreferrer"
            className="font-semibold text-bluedot-navy underline underline-offset-2 hover:text-bluedot-normal"
          >
            {builder.program.name}
          </a>
          {builder.credentialAfter}
        </P>
        <P className="text-size-xs leading-[1.65] text-bluedot-navy/65 mt-1">
          {builder.story}
        </P>
      </div>
    </div>
  );
};

const FieldBuildersSection = () => {
  const [showAll, setShowAll] = useState(false);
  const visibleBuilders = showAll ? BUILDERS : BUILDERS.slice(0, VISIBLE_COUNT);
  const hiddenCount = BUILDERS.length - VISIBLE_COUNT;

  return (
    <section className="section section-body builder-week-field-builders-section">
      <div className="w-full flex flex-col gap-7">
        <div className="flex flex-col gap-3">
          <H3 className={pageSectionHeadingClass}>
            Most AI safety programs started with someone seeing a talent gap, and building a pathway.
          </H3>
          <P className="max-w-[62ch]">
            They figured, &ldquo;I can just do the thing&rdquo; and <em>did it</em>.
          </P>
        </div>

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
