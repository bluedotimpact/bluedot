import { P } from '@bluedot/ui';
import {
  PiBriefcase,
  PiCompass,
  PiFlask,
} from 'react-icons/pi';
import { pageSectionHeadingClass } from '../PageListRow';

const AUDIENCES = [
  {
    icon: PiBriefcase,
    title: 'For technical founders',
    description: 'who\'ve identified a gap in AI safety infrastructure and want to fill it.',
  },
  {
    icon: PiFlask,
    title: 'For researchers',
    description: 'ready to leave the lab and ship something that changes behavior, not just beliefs.',
  },
  {
    icon: PiCompass,
    title: 'For operators',
    description: 'who\'ve seen how AI deployment actually works and know what\'s missing.',
  },
];

const WhatThisIsForSection = () => {
  return (
    <section className="section section-body incubator-week-what-section">
      <div className="w-full flex flex-col gap-6">
        <h3 className={pageSectionHeadingClass}>Who this is for</h3>

        <div className="flex flex-col gap-5">
          <P>
            Training isn&apos;t enough. We need new organizations to make AI go well. Incubator Week takes the strongest founders from our courses and backs them to build.
          </P>
          <P>
            We select from our AGI Strategy and Technical AI Safety courses. We&apos;re looking for people who can complete this sentence: &ldquo;Last year I built ___ which resulted in ___.&rdquo; Apply to our courses first, and we&apos;ll invite the strongest participants to Incubator Week.
          </P>
        </div>

        <div className="pt-2 grid gap-8 grid-cols-1 bd-md:grid-cols-3">
          {AUDIENCES.map(({ icon: Icon, title, description }) => (
            <div key={title} className="flex flex-col gap-5">
              <div className="size-14 rounded-lg flex items-center justify-center flex-shrink-0 bg-bluedot-lighter/40">
                <Icon className="text-bluedot-navy" size={28} />
              </div>
              <div className="flex flex-col gap-2">
                <h4 className="text-size-md font-semibold leading-tight text-bluedot-navy">
                  {title}
                </h4>
                <P className="text-size-sm leading-[1.6] text-bluedot-navy/80">
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

export default WhatThisIsForSection;
