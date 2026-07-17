import { H3, H4, P } from '@bluedot/ui';
import { useGrantApplicationUrl } from '../grants/useGrantApplicationUrl';
import { trpc } from '../../utils/trpc';

const FALLBACK_DECISION_BODY = 'On average we reply within a day, and 9 in 10 applicants hear back within a week.';

// Builds the "Get a decision" card body from live stats.
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
    body: 'Tell us what you\'re doing, what you need, and how much it costs. Takes five minutes.',
  },
  {
    number: '02',
    title: 'Get a decision',
    body: decisionBody,
  },
  {
    number: '03',
    title: 'Get paid',
    body: 'We pay upfront by default; sometimes we reimburse instead. We\'ll let you know which when we approve.',
  },
  {
    number: '04',
    title: 'Do the work',
    body: 'Use the funding for what we agreed on. If your plan shifts, tell us.',
  },
  {
    number: '05',
    title: 'Share your impact',
    body: 'A short update when you\'re done. What you did, what came of it. No formal report.',
  },
];

const COMMUNITY_CARD = {
  eyebrow: 'Beyond the grant',
  title: 'Community',
  body: 'Grantees join our community: intros, event invites, and follow-on opportunities as they come up.',
};

const cardBaseClass = 'rapid-grants-step-card relative overflow-hidden rounded-lg border px-5 py-5 min-h-[188px]';
const defaultCardClass = `${cardBaseClass} border-bluedot-navy/10 bg-white`;
const accentCardClass = `${cardBaseClass} border-bluedot-lighter bg-bluedot-lighter/20`;

const StepCardBody = ({ number, title, body, eyebrowClass }: {
  number: string;
  title: string;
  body: string;
  eyebrowClass: string;
}) => {
  return (
    <div className="flex h-full flex-col gap-6">
      <p className={`text-size-xxs font-semibold uppercase tracking-[0.12em] ${eyebrowClass}`}>
        {number}
      </p>
      <div className="flex flex-col gap-3">
        <H4 className="bd-md:text-size-lg font-medium tracking-[-0.04em]">
          {title}
        </H4>
        <P className="text-size-sm leading-[1.7] text-bluedot-navy/70">
          {body}
        </P>
      </div>
    </div>
  );
};

const HowItWorksSection = () => {
  const applicationUrl = useGrantApplicationUrl('rapid-grants');
  const { data: stats } = trpc.grants.getRapidGrantStats.useQuery();
  const decisionBody = buildDecisionBody(stats?.averageHoursToDecision, stats?.p90DaysToDecision);
  const processSteps = buildProcessSteps(applicationUrl, decisionBody);

  return (
    <section className="section section-body rapid-grants-how-section">
      <div className="w-full flex flex-col gap-6">
        <H3>How it works</H3>

        <div className="grid gap-4 bd-md:grid-cols-2 min-[960px]:grid-cols-3">
          {processSteps.map((step) => (
            step.url ? (
              <a
                key={step.title}
                href={step.url}
                target="_blank"
                rel="noopener noreferrer"
                className={`${accentCardClass} block cursor-pointer`}
              >
                <StepCardBody
                  number={step.number}
                  title={step.title}
                  body={step.body}
                  eyebrowClass="text-bluedot-dark"
                />
              </a>
            ) : (
              <div key={step.title} className={defaultCardClass}>
                <StepCardBody
                  number={step.number}
                  title={step.title}
                  body={step.body}
                  eyebrowClass="text-bluedot-navy/40"
                />
              </div>
            )
          ))}

          <div className={accentCardClass}>
            <StepCardBody
              number={COMMUNITY_CARD.eyebrow}
              title={COMMUNITY_CARD.title}
              body={COMMUNITY_CARD.body}
              eyebrowClass="text-bluedot-dark"
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
