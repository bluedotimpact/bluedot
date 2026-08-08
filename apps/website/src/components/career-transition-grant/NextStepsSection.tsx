import { H3, H4, P } from '@bluedot/ui';

const NEXT_STEPS = [
  {
    title: 'You apply',
    body: 'Complete the application form. It takes around 45 minutes and asks about your recent work, proposed transition, theory of change, milestones and funding request.',
  },
  {
    title: 'We determine the right route',
    body: 'We first assess whether the request is a good fit for a Career Transition Grant or whether another funding route would be more appropriate.',
  },
  {
    title: 'We review the relevant evidence',
    body: 'If the application is promising, we may review your work sample, ask a focused follow-up question, seek expert input or contact a reference. We only request additional information when it could materially affect our decision.',
  },
  {
    title: 'We interview selected applicants',
    body: 'Interviews focus on the most important remaining questions about your plan, reasoning and ability to execute.',
  },
  {
    title: 'We decide and set up the grant',
    body: 'If approved, we agree the amount, duration and any relevant milestones, then arrange payment so you can begin.',
  },
];

const NextStepsSection = () => {
  return (
    <section className="section section-body career-transition-grant-next-steps-section">
      <div className="w-full flex flex-col gap-6">
        <H3>What happens next</H3>

        <ol className="grid gap-8 bd-md:gap-6 grid-cols-1 bd-md:grid-cols-2 min-[1120px]:grid-cols-3">
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

export default NextStepsSection;
