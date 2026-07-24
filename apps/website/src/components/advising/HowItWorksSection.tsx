import { H3, H4, P } from '@bluedot/ui';

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
        <H3>How it works</H3>

        <ol className="grid gap-8 bd-md:gap-6 grid-cols-1 bd-md:grid-cols-3">
          {STEPS.map((step, index) => (
            <li key={step.title} className="flex flex-col gap-3">
              <span
                className="flex items-center justify-center size-8 rounded-full bg-bluedot-normal text-white text-size-xs font-semibold"
                aria-hidden="true"
              >
                {index + 1}
              </span>
              <H4>
                {step.title}
              </H4>
              <P className="text-bluedot-navy/80">
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
