import { P, Section } from '@bluedot/ui';

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
    <Section className="career-transition-grant-next-steps-section" title="What happens next">
      <ol className="grid gap-8 md:gap-6 grid-cols-1 md:grid-cols-3 max-w-[1120px]">
        {NEXT_STEPS.map((step, index) => (
          <li key={step.title} className="flex flex-col gap-3">
            <span
              className="flex items-center justify-center size-8 rounded-full bg-bluedot-normal text-white text-[13px] font-semibold"
              aria-hidden="true"
            >
              {index + 1}
            </span>
            <h3 className="text-[18px] font-semibold text-bluedot-darker">
              {step.title}
            </h3>
            <P className="text-size-sm leading-[1.65] text-bluedot-darker/80">
              {step.body}
            </P>
          </li>
        ))}
      </ol>
    </Section>
  );
};

export default NextStepsSection;
