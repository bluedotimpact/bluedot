import {
  addQueryParam, ErrorSection, H3, H4, P, ProgressDots,
} from '@bluedot/ui';
import type { IconType } from 'react-icons';
import {
  LuArrowRight, LuArrowUpRight, LuBlocks, LuComponent, LuRoute, LuShield,
} from 'react-icons/lu';
import { getGrantPath } from '../../lib/grantRoutes';
import { AI_SECURITY_BOOTCAMP } from '../../lib/publicPrograms';
import { trpc } from '../../utils/trpc';

// Keep the action stage in the brand-blue palette, distinct from course colours.
const ACTION_GRADIENTS = {
  funding: 'radial-gradient(ellipse at 0% 0%, color-mix(in srgb, var(--bluedot-light) 22%, var(--bluedot-navy)) 0%, var(--bluedot-navy) 65%, var(--bluedot-darker) 100%)',
  careerTransition: 'radial-gradient(ellipse at 100% 110%, color-mix(in srgb, var(--bluedot-light) 62%, var(--bluedot-navy)) 0%, color-mix(in srgb, var(--bluedot-light) 30%, var(--bluedot-navy)) 55%, var(--bluedot-navy) 100%)',
  programs: 'radial-gradient(ellipse at 100% 0%, var(--bluedot-normal) 0%, var(--bluedot-dark) 60%, var(--bluedot-darker) 100%)',
  securityBootcamp: 'linear-gradient(130deg, color-mix(in srgb, var(--bluedot-normal) 60%, var(--bluedot-navy)) 0%, var(--bluedot-darker) 60%, var(--bluedot-navy) 100%)',
} as const;

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
  icon: IconType;
  gradient?: string;
  external?: boolean;
};

const ActionCard = ({ card, gradient }: { card: ActionCardData; gradient: string }) => {
  const Icon = card.icon;
  const Arrow = card.external ? LuArrowUpRight : LuArrowRight;

  return (
    <a
      href={card.href}
      target={card.external ? '_blank' : undefined}
      rel={card.external ? 'noopener noreferrer' : undefined}
      aria-labelledby={`homepage-action-${card.id}`}
      className="action-cards__card group relative flex h-full min-h-56 flex-col overflow-hidden rounded-surface border border-bluedot-navy/10 p-6 md:p-7 text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-bluedot-normal"
      style={{ background: card.gradient ?? gradient }}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 mix-blend-soft-light opacity-30"
        style={{
          backgroundImage: 'url(/images/agi-strategy/noise.webp)',
          backgroundRepeat: 'repeat',
          backgroundSize: '464.64px 736.56px',
        }}
      />
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-black/20 opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-focus-visible:opacity-100 motion-reduce:transition-none" />
      <div className="relative mb-7 flex items-start justify-between gap-4">
        <Icon aria-hidden="true" className="size-7" strokeWidth={1.4} />
        <Arrow aria-hidden="true" className="size-6 opacity-70 transition-[transform,opacity] duration-200 group-hover:translate-x-1 group-hover:opacity-100 group-focus-visible:translate-x-1 group-focus-visible:opacity-100 motion-reduce:transform-none motion-reduce:transition-none" />
      </div>
      <div className="relative mt-auto flex flex-col gap-3">
        <H4 className="text-size-lg font-medium leading-snug tracking-tight text-white">
          <span id={`homepage-action-${card.id}`}>
            {card.title}
            {card.external && <span className="sr-only"> (opens in a new tab)</span>}
          </span>
        </H4>
        {card.description && <P className="text-white/85">{card.description}</P>}
      </div>
    </a>
  );
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
      icon: grant.slug === 'career-transition-grant' ? LuRoute : LuBlocks,
      gradient: grant.slug === 'career-transition-grant' ? ACTION_GRADIENTS.careerTransition : undefined,
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
      icon: LuComponent,
      external: /^https?:\/\//.test(href),
    }];
  });
  programCards.push({
    id: 'ai-security-bootcamp',
    title: AI_SECURITY_BOOTCAMP.title,
    description: 'Build practical AI security skills through intensive, in-person training.',
    href: withHomepageTracking(AI_SECURITY_BOOTCAMP.url, 'homepage-programs'),
    icon: LuShield,
    gradient: ACTION_GRADIENTS.securityBootcamp,
    external: true,
  });

  const groups = [
    {
      id: 'funding', title: 'Get funding', cards: grantCards, query: grants, gradient: ACTION_GRADIENTS.funding,
    },
    {
      id: 'programs', title: 'Join an in-person program', cards: programCards, query: programs, gradient: ACTION_GRADIENTS.programs,
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
                  <ActionCard card={card} gradient={group.gradient} />
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
