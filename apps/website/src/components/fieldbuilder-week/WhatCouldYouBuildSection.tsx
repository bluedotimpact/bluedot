import { H3, H4, P } from '@bluedot/ui';
import {
  PiFlask,
  PiGearSix,
  PiMegaphone,
  PiPencilSimple,
  PiCompass,
  PiSparkle,
} from 'react-icons/pi';

const EXAMPLES = [
  {
    icon: PiFlask,
    title: 'Biosecurity stream',
    description: 'for MATS or other fellowships.',
  },
  {
    icon: PiGearSix,
    title: 'Ops bootcamps',
    description: 'to bring in senior ops talent.',
  },
  {
    icon: PiMegaphone,
    title: 'Creator fellowships',
    description: 'to generate greater public awareness on AI safety.',
  },
  {
    icon: PiPencilSimple,
    title: 'Writing fellowships',
    description: 'to translate complex ideas in AI safety for specific audiences.',
  },
  {
    icon: PiCompass,
    title: 'Expert fellowships',
    description: 'to bring particular experts into the field.',
  },
];

const WhatCouldYouBuildSection = () => {
  return (
    <section className="section section-body fieldbuilder-week-what-could-you-build-section">
      <div className="w-full flex flex-col gap-6">
        <H3>What could you build?</H3>
        <div className="grid gap-5 grid-cols-1 bd-md:grid-cols-2 lg:grid-cols-3">
          {EXAMPLES.map(({ icon: Icon, title, description }) => (
            <div
              key={title}
              className="flex flex-col gap-4 rounded-xl border border-bluedot-navy/10 bg-white p-6"
            >
              <div className="size-12 rounded-lg flex items-center justify-center flex-shrink-0 bg-bluedot-lighter/50">
                <Icon className="text-bluedot-navy" size={24} />
              </div>
              <div className="flex flex-col gap-1.5">
                <H4>
                  {title}
                </H4>
                <P className="text-size-sm leading-relaxed text-bluedot-navy/80">
                  {description}
                </P>
              </div>
            </div>
          ))}
          <div className="flex flex-col gap-4 rounded-xl border-2 border-dashed border-bluedot-navy/20 bg-bluedot-lighter/20 p-6">
            <div className="size-12 rounded-lg flex items-center justify-center flex-shrink-0 bg-bluedot-lighter/60">
              <PiSparkle className="text-bluedot-navy" size={24} />
            </div>
            <div className="flex flex-col gap-1.5">
              <H4>
                Your idea
              </H4>
              <P className="text-size-sm leading-relaxed text-bluedot-navy/80">
                Pitch us whatever you&apos;ve been sitting on. If it brings serious talent into AI safety, we want to hear it.
              </P>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default WhatCouldYouBuildSection;
