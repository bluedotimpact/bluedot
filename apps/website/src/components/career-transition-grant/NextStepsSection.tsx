import { P } from '@bluedot/ui';

// TODO: replace with pageSectionHeadingClass from ../PageListRow once #2309 lands
const SECTION_HEADING_CLASS = 'text-[24px] font-bold tracking-[-0.4px] leading-[1.333] text-bluedot-navy';

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
      <div className="w-full min-[680px]:max-w-[1120px] min-[680px]:mx-auto flex flex-col gap-6">
        <h3 className={SECTION_HEADING_CLASS}>What happens next</h3>

        <ol className="grid gap-8 md:gap-6 grid-cols-1 md:grid-cols-3">
          {NEXT_STEPS.map((step, index) => (
            <li key={step.title} className="flex flex-col gap-3">
              <span
                className="flex items-center justify-center size-8 rounded-full bg-bluedot-normal text-white text-[13px] font-semibold"
                aria-hidden="true"
              >
                {index + 1}
              </span>
              <h4 className="text-[18px] font-semibold text-bluedot-navy">
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
