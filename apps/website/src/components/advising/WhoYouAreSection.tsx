import { P } from '@bluedot/ui';
import { type IconType } from 'react-icons';
import { PiArrowsClockwise, PiCompass, PiGraduationCap } from 'react-icons/pi';
import { pageSectionHeadingClass } from '../PageListRow';

const ACCENT_COLOR = '#1F588A';

type Persona = {
  icon: IconType;
  title: string;
  description: string;
};

const PERSONAS: Persona[] = [
  {
    icon: PiGraduationCap,
    title: 'BlueDot graduate',
    description: 'You know the landscape, and you\'ve laid out your options through your action plan and 1-pager. The hard part now is committing to one direction and making real progress.',
  },
  {
    icon: PiArrowsClockwise,
    title: 'Pivoting your career',
    description: 'You\'re making big moves to contribute your personal and professional experience to AI safety. You\'ve left your current job (or are planning to), gone on sabbatical or are applying to roles or programs. You need help figuring out what the transition looks like for someone with your background.',
  },
  {
    icon: PiCompass,
    title: 'Finding your fit',
    description: 'You\'ve completed fellowships, run reading groups and published your thinking on AI safety. You\'re looking for where you can make an impactful contribution given your background, and how you can get there.',
  },
];

const WhoYouAreSection = () => {
  return (
    <section className="section section-body advising-who-you-are-section">
      <div className="w-full flex flex-col gap-6">
        <h3 className={pageSectionHeadingClass}>Who you are</h3>

        <div className="flex flex-col gap-4">
          {PERSONAS.map(({ icon: Icon, title, description }) => (
            <div
              key={title}
              className="bg-white rounded-xl border border-bluedot-navy/10 overflow-hidden"
            >
              <div
                className="w-full px-6 py-5 bd-md:px-8 bd-md:py-6 flex items-center gap-4"
                style={{ backgroundColor: ACCENT_COLOR }}
              >
                <div
                  className="size-12 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}
                >
                  <Icon size={24} className="text-white" />
                </div>
                <span className="text-size-md font-semibold leading-[130%] flex-grow text-left text-white">
                  {title}
                </span>
              </div>
              <div className="p-6 bd-md:p-8">
                <P className="text-size-sm leading-[1.7] text-bluedot-navy/70">
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

export default WhoYouAreSection;
