import { H3, H4, P } from '@bluedot/ui';

const NEXT_STEPS = [
  {
    title: 'You apply',
    body: 'Fill in the application form. It takes around 45 minutes.',
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
        <H3>What happens next</H3>

        <ol className="grid gap-8 bd-md:gap-6 grid-cols-1 bd-md:grid-cols-3">
          {NEXT_STEPS.map((step, index) => (
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
              <P className="text-size-sm leading-relaxed text-bluedot-navy/80">
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
