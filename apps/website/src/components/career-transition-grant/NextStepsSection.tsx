import { P } from '@bluedot/ui';
import { pageSectionHeadingClass } from '../PageListRow';

const NEXT_STEPS = [
  {
    title: 'You submit',
    body: 'Send us your 1-2 page proposal covering the prompts above.',
  },
  {
    title: 'We review and book a call',
    body: 'If we want to talk or need more information, we schedule a call to discuss next steps.',
  },
  {
    title: 'Grant starts',
    body: 'Once approved, we set up the grant within a few days so you can start right away.',
  },
];

const NextStepsSection = () => {
  return (
    <section className="section section-body career-transition-grant-next-steps-section">
      <div className="w-full flex flex-col gap-6">
        <h3 className={pageSectionHeadingClass}>What happens next</h3>

        <ol className="grid gap-8 bd-md:gap-6 grid-cols-1 bd-md:grid-cols-3">
          {NEXT_STEPS.map((step, index) => (
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

export default NextStepsSection;
