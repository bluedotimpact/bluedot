import {
  P,
} from '@bluedot/ui';
import { useApplicationUrl } from '../../lib/hooks/useApplicationUrl';
import { trpc } from '../../utils/trpc';

const FALLBACK_DECISION_BODY = 'We review your application and email you a decision.';

// Builds the "Get a decision" step body from live stats.
// Average is the 10%-trimmed mean in hours (robust to outliers). p90 in days (rounded up).
// Returns a stable fallback while tRPC is loading or when no decided rows exist yet.
const buildDecisionBody = (averageHours: number | null | undefined, p90Days: number | null | undefined): string => {
  if (averageHours === null || averageHours === undefined || p90Days === null || p90Days === undefined) {
    return FALLBACK_DECISION_BODY;
  }

  const averageDays = Math.max(1, Math.round(averageHours / 24));
  const averageLabel = averageDays === 1 ? 'within a day' : `in ${averageDays} days`;
  const tail = p90Days <= 7 ? 'within a week' : `within ${p90Days} days`;
  return `On average we reply ${averageLabel}, and 9 in 10 applicants hear back ${tail}.`;
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
  const decisionBody = buildDecisionBody(stats?.averageHoursToDecision, stats?.p90DaysToDecision);
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
