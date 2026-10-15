import {
  Button, H3, H4, P,
} from '@bluedot/ui';
import { FaChevronRight } from 'react-icons/fa6';
import { useApplicationUrl } from '../../lib/hooks/useApplicationUrl';

const NEXT_STEPS = [
  {
    title: 'You apply',
    body: 'The form takes about 45 minutes. Choose “Starting an organization” when it asks what you’re seeking funding for.',
  },
  {
    title: 'We review your application',
    body: 'Someone on our team with expertise in your area reads it.',
  },
  {
    title: 'We talk',
    body: 'If it looks promising, we’ll set up a call to dig into your plan.',
  },
  {
    title: 'We decide',
    body: 'We aim to decide within about 4 weeks of your application.',
  },
  {
    title: 'We set up the grant',
    body: 'You sign a grant agreement and we pay you.',
  },
];

const NextStepsSection = () => {
  const applicationUrl = useApplicationUrl('seed');

  return (
    <section className="section section-body seed-grant-next-steps-section">
      <div className="w-full flex flex-col gap-6">
        <H3>How it works</H3>

        <ol className="grid gap-8 bd-md:gap-6 grid-cols-1 bd-md:grid-cols-2 min-[1120px]:grid-cols-3">
          {NEXT_STEPS.map((step, index) => (
            <li key={step.title} className="flex flex-col gap-3">
              <span
                className="flex items-center justify-center size-8 rounded-full bg-bluedot-normal text-white text-size-xs font-semibold"
                aria-hidden="true"
              >
                {index + 1}
              </span>
              <H4>{step.title}</H4>
              <P className="text-secondary">{step.body}</P>
            </li>
          ))}
        </ol>

        {applicationUrl && (
          <div>
            <Button url={applicationUrl} target="_blank">
              Apply for a Seed Grant
              <FaChevronRight aria-hidden className="size-4" />
            </Button>
          </div>
        )}
      </div>
    </section>
  );
};

export default NextStepsSection;
