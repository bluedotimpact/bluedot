import { P } from '@bluedot/ui';
import { pageSectionHeadingClass } from '../PageListRow';

const STEPS = [
  {
    title: 'Apply',
    body: 'Tell us what you\'re considering, and what you\'ve done so far.',
  },
  {
    title: 'Get a decision',
    body: 'We usually respond within 5 working days.',
  },
  {
    title: 'Book a call',
    body: 'If approved, we\'ll send you a booking link to have a chat with us.',
  },
];

const HowItWorksSection = () => {
  return (
    <section className="section section-body advising-how-section">
      <div className="w-full flex flex-col gap-6">
        <h3 className={pageSectionHeadingClass}>How it works</h3>

        <ol className="grid gap-8 bd-md:gap-6 grid-cols-1 bd-md:grid-cols-3">
          {STEPS.map((step, index) => (
            <li key={step.title} className="flex flex-col gap-3">
              <span
                className="flex items-center justify-center size-8 rounded-full bg-bluedot-normal text-white text-size-xs font-semibold"
                aria-hidden="true"
              >
                {index + 1}
              </span>
              <h4 className="text-size-md font-semibold text-bluedot-navy">
                {step.title}
              </h4>
              <P className="text-size-sm leading-[1.65] text-bluedot-navy/80">
                {step.body}
              </P>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
};

export default HowItWorksSection;
