import {
  addQueryParam, ErrorSection, H3, ProgressDots,
} from '@bluedot/ui';
import OpportunityCard, { type OpportunityCardTone } from '../OpportunityCard';
import { getGrantPath } from '../../lib/grantRoutes';
import { AI_SECURITY_BOOTCAMP } from '../../lib/publicPrograms';
import { trpc } from '../../utils/trpc';

const HOMEPAGE_DESCRIPTIONS: Record<string, string> = {
  'rapid-grants': 'Get funding to run a project, host an event, or test an idea in AI safety or biosecurity.',
  'career-transition-grant': 'Get the funding and support to move into AI safety or biosecurity full-time.',
  'incubator-week': 'Five days in San Francisco to build your idea. All expenses paid. Up to $100k if we back your pitch.',
};

const withHomepageTracking = (href: string, campaign: string) => (
  addQueryParam(addQueryParam(href, 'utm_source', 'website'), 'utm_campaign', campaign)
);

type ActionCardData = {
  id: string;
  title: string;
  description: string | null;
  href: string;
  tone: OpportunityCardTone;
  external?: boolean;
};

const ActionCards = () => {
  const grants = trpc.programs.getGrants.useQuery();
  const programs = trpc.programs.getInPerson.useQuery();

  // Keep visibility and ordering driven by the active catalogue. The homepage
  // gets shorter descriptions, while new entries retain their catalogue copy.
  const grantCards: ActionCardData[] = (grants.data ?? []).flatMap((grant) => {
    const href = getGrantPath(grant.slug);
    if (!href) return [];
    return [{
      id: grant.id,
      title: grant.name,
      description: HOMEPAGE_DESCRIPTIONS[grant.slug ?? ''] ?? grant.description,
      href: withHomepageTracking(href, 'homepage-grants'),
      tone: grant.slug === 'career-transition-grant' ? 'careerTransition' : 'funding',
    }];
  });

  const programCards: ActionCardData[] = (programs.data ?? []).flatMap((program) => {
    const href = program.slug ? `/programs/${program.slug}` : program.applicationForm;
    if (!href) return [];
    return [{
      id: program.id,
      title: program.name,
      description: HOMEPAGE_DESCRIPTIONS[program.slug ?? ''] ?? program.description,
      href: withHomepageTracking(href, 'homepage-programs'),
      tone: 'programs',
      external: /^https?:\/\//.test(href),
    }];
  });
  programCards.push({
    id: 'ai-security-bootcamp',
    title: AI_SECURITY_BOOTCAMP.title,
    description: 'Build practical AI security skills through intensive, in-person training.',
    href: withHomepageTracking(AI_SECURITY_BOOTCAMP.url, 'homepage-programs'),
    tone: 'securityBootcamp',
    external: true,
  });

  const groups = [
    {
      id: 'funding', title: 'Get funding', cards: grantCards, query: grants,
    },
    {
      id: 'programs', title: 'Join an in-person program', cards: programCards, query: programs,
    },
  ];

  return (
    <div className="action-cards grid grid-cols-1 gap-8 bd-md:grid-cols-2 bd-md:gap-5 lg:gap-6">
      {groups.map((group) => {
        let content;
        if (group.query.error) {
          content = <ErrorSection error={group.query.error} />;
        } else if (group.query.isLoading) {
          content = <ProgressDots />;
        } else {
          content = (
            <ul className="grid flex-1 auto-rows-fr list-none gap-5 lg:gap-6">
              {group.cards.map((card) => (
                <li key={card.id} className="min-w-0">
                  <OpportunityCard {...card} compact headingLevel={4} />
                </li>
              ))}
            </ul>
          );
        }

        return (
          <section key={group.id} aria-labelledby={`homepage-actions-${group.id}`} className="action-cards__group flex min-w-0 flex-col gap-4">
            <H3 className="text-size-xxs font-medium uppercase tracking-wide text-secondary">
              <span id={`homepage-actions-${group.id}`}>{group.title}</span>
            </H3>
            {content}
          </section>
        );
      })}
    </div>
  );
};

export default ActionCards;
