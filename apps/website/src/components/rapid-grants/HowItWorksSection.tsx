import {
  P,
} from '@bluedot/ui';
import { useApplicationUrl } from '../../lib/hooks/useApplicationUrl';
import { trpc } from '../../utils/trpc';

const FALLBACK_DECISION_BODY = 'We review your application and email you a decision.';

const buildDecisionBody = ({ averageDays }: { averageDays: number | null | undefined }): string => {
  if (averageDays == null) return FALLBACK_DECISION_BODY;

  const roundedDays = Math.max(1, Math.round(averageDays));
  const averageLabel = roundedDays === 1 ? 'within a day' : `in ${roundedDays} days`;
  return `On average we make a decision ${averageLabel}.`;
};

const buildProcessSteps = (applicationUrl: string | undefined, decisionBody: string) => [
  {
    number: '01',
    title: 'Apply',
    url: applicationUrl,
    body: 'Tell us your plan and budget. Takes about 15 minutes.',
  },
  {
    number: '02',
    title: 'Get a decision',
    body: decisionBody,
  },
  {
    number: '03',
    title: 'Receive funding',
    body: 'Submit a claim through our claims portal. We pay a single lump sum after any required checks.',
  },
];

const HowItWorksSection = () => {
  const applicationUrl = useApplicationUrl('rapid');
  const { data: stats } = trpc.grants.getRapidGrantStats.useQuery();
  const decisionBody = buildDecisionBody({ averageDays: stats?.averageDaysToDecision });
  const processSteps = buildProcessSteps(applicationUrl, decisionBody);

  return (
    <section className="section-base rapid-grants-how-section">
      <div className="flex flex-col gap-6 border-b border-bluedot-navy/15 py-10 bd-md:py-12">
        <h2 className="text-size-lg font-medium tracking-tight">How it works</h2>

        <ol className="grid list-none gap-5 p-0 bd-md:grid-cols-3 bd-md:gap-8">
          {processSteps.map((step) => (
            <li key={step.title} className="min-w-0">
              <div className="mb-2 flex items-baseline gap-3">
                <span className="text-size-xs text-secondary" aria-hidden="true">{step.number}</span>
                <h3 className="text-size-sm font-medium">
                  {step.url ? (
                    <a
                      href={step.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline underline-offset-4"
                    >
                      {step.title}
                    </a>
                  ) : step.title}
                </h3>
              </div>
              <P className="text-size-sm text-secondary">{step.body}</P>
            </li>
          ))}
        </ol>

      </div>
    </section>
  );
};

export default HowItWorksSection;
