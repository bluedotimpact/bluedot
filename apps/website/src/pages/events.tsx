import { useState } from 'react';
import {
  addQueryParam,
  Breadcrumbs,
  CTALinkOrButton,
  ErrorSection,
  H1,
  P,
  ProgressDots,
  Section,
  type BluedotRoute,
} from '@bluedot/ui';
import Head from 'next/head';
import LandingBanner from '../components/lander/components/LandingBanner';
import { Nav } from '../components/Nav/Nav';
import { buildTimeDeltaString } from '../components/events/eventsUtils';
import { ROUTES } from '../lib/routes';
import type { Event } from '../server/routers/luma';
import { trpc } from '../utils/trpc';

const CURRENT_ROUTE: BluedotRoute = {
  title: 'Events',
  url: ROUTES.events.url,
  parentPages: [ROUTES.home],
};

const LUMA_CALENDAR_URL = 'https://lu.ma/bluedotevents';
const UPCOMING_EVENTS_ANCHOR = 'upcoming-events';
const VISIBLE_EVENTS_COUNT = 20;
const CITY_FILTER_MIN_EVENTS = 2;

type EventFilterKey = 'all' | 'virtual' | 'in-person' | 'london' | 'san-francisco';
type EventsPageCtaContent = 'top-cta' | 'event-title' | 'event-link' | 'empty-cta' | 'footer-banner';

const addEventsPageUtm = (url: string, content: EventsPageCtaContent) => {
  const withSource = addQueryParam(url, 'utm_source', 'website');
  const withCampaign = addQueryParam(withSource, 'utm_campaign', 'events-page');
  return addQueryParam(withCampaign, 'utm_content', content);
};

const formatLocationLabel = (location: string) => {
  if (location === 'ONLINE') {
    return 'Virtual';
  }

  return location
    .toLowerCase()
    .split(' ')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
};

const formatMonth = (dateString: string) => new Date(dateString).toLocaleString('en-US', { month: 'short' }).toUpperCase();
const formatDay = (dateString: string) => new Date(dateString).getDate().toString();
const formatMonthLabel = (dateString: string) => new Intl.DateTimeFormat('en-US', {
  month: 'long',
  year: 'numeric',
}).format(new Date(dateString));

const EventDescriptionToggle = ({
  eventId,
  description,
}: {
  eventId: string;
  description?: string;
}) => {
  const [isOpen, setIsOpen] = useState(false);

  if (!description) {
    return null;
  }

  return (
    <div className="mt-2">
      <button
        type="button"
        onClick={() => setIsOpen((currentValue) => !currentValue)}
        className="text-[13px] font-medium text-bluedot-normal transition-colors hover:text-[#1a3599]"
        aria-expanded={isOpen}
        aria-controls={`event-description-${eventId}`}
      >
        {isOpen ? 'Hide description' : 'Show description'}
      </button>
      {isOpen && (
        <P
          id={`event-description-${eventId}`}
          className="mt-3 whitespace-pre-line text-bluedot-navy/78"
        >
          {description}
        </P>
      )}
    </div>
  );
};

const groupEventsByMonth = (events: Event[]) => {
  const groups: { month: string; events: Event[] }[] = [];

  for (const event of events) {
    const month = formatMonthLabel(event.startAt);
    const existingGroup = groups[groups.length - 1];

    if (existingGroup?.month === month) {
      existingGroup.events.push(event);
    } else {
      groups.push({ month, events: [event] });
    }
  }

  return groups;
};

const FILTER_LABELS: Record<EventFilterKey, string> = {
  all: 'All',
  virtual: 'Virtual',
  'in-person': 'In person',
  london: 'London',
  'san-francisco': 'San Francisco',
};

const matchesFilter = (event: Event, filter: EventFilterKey) => {
  switch (filter) {
    case 'all':
      return true;
    case 'virtual':
      return event.location === 'ONLINE';
    case 'in-person':
      return event.location !== 'ONLINE';
    case 'london':
      return event.location === 'LONDON';
    case 'san-francisco':
      return event.location === 'SAN FRANCISCO';
    default:
      return true;
  }
};

const EventsHero = () => {
  return (
    <section className="relative w-full min-h-[317px] min-[680px]:min-h-[366px]">
      <Nav variant="transparent" />
      <img
        src="/images/homepage/hero.webp"
        alt=""
        className="absolute inset-0 size-full object-cover -scale-x-100"
        {...{ fetchpriority: 'high' }}
      />
      <div className="relative z-10 flex flex-col justify-end h-full min-h-[317px] min-[680px]:min-h-[366px] pb-12 pt-20 min-[680px]:pb-16 min-[680px]:pt-20">
        <div className="w-full mx-auto max-w-max-width px-spacing-x">
          <div className="flex flex-col gap-6 max-w-[780px]">
            <H1 className="text-[32px] min-[680px]:text-[40px] min-[1024px]:text-[48px] leading-tight font-medium tracking-[-1px] text-white">
              Events
            </H1>
            <p className="text-size-sm min-[680px]:text-[18px] min-[1024px]:text-[20px] leading-[1.55] tracking-[-0.1px] text-white">
              Recurring groups, meetups, socials, and workshops for the BlueDot community.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

const EventDateBadge = ({ event }: { event: Event }) => {
  return (
    <div className="flex size-[68px] shrink-0 flex-col overflow-hidden rounded-[16px] border border-[#D6E3F4] bg-white shadow-[0_10px_28px_rgba(7,31,72,0.08)]">
      <div className="flex items-center justify-center border-b border-[#D6E3F4] bg-[linear-gradient(90deg,#245EC8_0%,#3878EA_100%)] px-2 py-1.5">
        <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white">
          {formatMonth(event.startAt)}
        </span>
      </div>
      <div className="flex flex-1 items-center justify-center">
        <span className="text-[28px] font-medium tracking-[-0.05em] text-bluedot-navy">
          {formatDay(event.startAt)}
        </span>
      </div>
    </div>
  );
};

const EventListRow = ({
  event,
}: {
  event: Event;
}) => {
  const eventTitleUrl = addEventsPageUtm(event.url, 'event-title');
  const eventLinkUrl = addEventsPageUtm(event.url, 'event-link');

  return (
    <article className="rounded-[20px] border border-bluedot-navy/10 bg-white px-5 py-5 min-[680px]:px-6">
      <div className="flex flex-col gap-4 min-[900px]:flex-row min-[900px]:items-center min-[900px]:justify-between">
        <div className="flex flex-col gap-4 min-[680px]:flex-row min-[680px]:items-start min-[680px]:gap-5">
          <EventDateBadge event={event} />

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-[#D7E4F5] bg-[#F4F8FD] px-3 py-1 text-[12px] font-semibold uppercase tracking-[0.12em] text-[#2A5FA8]">
                {formatLocationLabel(event.location)}
              </span>
            </div>
            <h3 className="mt-3 text-[19px] min-[680px]:text-[21px] font-semibold leading-[1.2] tracking-[-0.02em] text-bluedot-navy">
              <a
                href={eventTitleUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="transition-colors hover:text-[#1a3599]"
              >
                {event.title}
              </a>
            </h3>
            <P className="mt-2">{buildTimeDeltaString(event)}</P>
            <EventDescriptionToggle eventId={event.id} description={event.description} />
          </div>
        </div>

        <div>
          <CTALinkOrButton url={eventLinkUrl} target="_blank" variant="secondary" withChevron>
            View on Luma
          </CTALinkOrButton>
        </div>
      </div>
    </article>
  );
};

const EventsPage = () => {
  const { data: events, isLoading, error } = trpc.luma.getUpcomingEvents.useQuery();
  const [selectedFilter, setSelectedFilter] = useState<EventFilterKey>('all');
  const topCalendarUrl = addEventsPageUtm(LUMA_CALENDAR_URL, 'top-cta');
  const emptyCalendarUrl = addEventsPageUtm(LUMA_CALENDAR_URL, 'empty-cta');
  const footerCalendarUrl = addEventsPageUtm(LUMA_CALENDAR_URL, 'footer-banner');

  const upcomingEvents = events ?? [];
  const visibleEvents = upcomingEvents.slice(0, VISIBLE_EVENTS_COUNT);
  const londonCount = visibleEvents.filter((event) => event.location === 'LONDON').length;
  const sanFranciscoCount = visibleEvents.filter((event) => event.location === 'SAN FRANCISCO').length;
  const availableFilters: EventFilterKey[] = ['all'];

  if (visibleEvents.some((event) => event.location === 'ONLINE')) {
    availableFilters.push('virtual');
  }

  if (visibleEvents.some((event) => event.location !== 'ONLINE')) {
    availableFilters.push('in-person');
  }

  if (londonCount >= CITY_FILTER_MIN_EVENTS) {
    availableFilters.push('london');
  }

  if (sanFranciscoCount >= CITY_FILTER_MIN_EVENTS) {
    availableFilters.push('san-francisco');
  }

  const activeFilter = availableFilters.includes(selectedFilter) ? selectedFilter : 'all';
  const filteredListEvents = visibleEvents.filter((event) => matchesFilter(event, activeFilter));
  const groupedListEvents = groupEventsByMonth(filteredListEvents);
  const showFilters = visibleEvents.length >= 4 && availableFilters.length > 1;

  return (
    <div>
      <Head>
        <title>{`${CURRENT_ROUTE.title} | BlueDot Impact`}</title>
        <meta
          name="description"
          content="Browse upcoming BlueDot events, including reading groups, coffee chats, workshops, socials, and city meetups."
        />
      </Head>

      <EventsHero />
      <Breadcrumbs route={CURRENT_ROUTE} />

      <Section className="events-featured-section">
        <div className="flex flex-col gap-8">
          <div
            id={UPCOMING_EVENTS_ANCHOR}
            className="scroll-mt-28 flex flex-col gap-4 min-[960px]:flex-row min-[960px]:items-end min-[960px]:justify-between"
          >
            <div className="max-w-[760px]">
              <P>
                Most BlueDot events live on Luma. This page is the quick scan - what's coming up, what we run, and where to RSVP.
              </P>
              <P className="mt-3 text-[14px] leading-[1.55] text-bluedot-navy/72">
                Virtual events are shown in your local time. In-person events are shown in local venue time.
              </P>
            </div>
            <div className="flex flex-wrap gap-3">
              <CTALinkOrButton url={topCalendarUrl} target="_blank">
                Open the full Luma calendar
              </CTALinkOrButton>
            </div>
          </div>

          {isLoading && <ProgressDots />}
          {error && <ErrorSection error={error} />}

          {!isLoading && !error && visibleEvents.length > 0 && (
            <div className="flex flex-col gap-8">
              {showFilters && (
                <div className="flex flex-wrap gap-3">
                  {availableFilters.map((filter) => {
                    const isActive = activeFilter === filter;

                    return (
                      <button
                        key={filter}
                        type="button"
                        onClick={() => setSelectedFilter(filter)}
                        className={isActive
                          ? 'inline-flex items-center justify-center rounded-full bg-bluedot-navy px-4 py-2 text-[14px] font-medium text-white'
                          : 'inline-flex items-center justify-center rounded-full border border-bluedot-navy/12 bg-white px-4 py-2 text-[14px] font-medium text-bluedot-navy transition-colors hover:border-bluedot-navy/22'}
                        aria-pressed={isActive}
                      >
                        {FILTER_LABELS[filter]}
                      </button>
                    );
                  })}
                </div>
              )}

              <div className="flex flex-col gap-10">
                {groupedListEvents.length > 0 ? (
                  groupedListEvents.map((group) => (
                    <div key={group.month}>
                      <h3 className="text-[18px] min-[680px]:text-[20px] font-semibold leading-[1.15] tracking-[-0.02em] text-bluedot-navy">
                        {group.month}
                      </h3>
                      <div className="mt-4 flex flex-col gap-4">
                        {group.events.map((event) => (
                          <EventListRow key={event.id} event={event} />
                        ))}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-[20px] border border-bluedot-navy/10 bg-white px-5 py-6">
                    <P>No events match this filter right now.</P>
                  </div>
                )}
              </div>
            </div>
          )}

          {!isLoading && !error && upcomingEvents.length === 0 && (
            <div className="rounded-[24px] border border-bluedot-navy/10 bg-white px-6 py-8">
              <P>No upcoming events are showing right now. Check the Luma calendar directly for the latest updates.</P>
              <div className="mt-5">
                <CTALinkOrButton url={emptyCalendarUrl} target="_blank">
                  Open the full Luma calendar
                </CTALinkOrButton>
              </div>
            </div>
          )}
        </div>
      </Section>

      <LandingBanner
        title="Keep pace with the BlueDot community calendar"
        ctaText="Open the Luma calendar"
        ctaUrl={footerCalendarUrl}
        imageSrc="/images/courses/courses-gradient.webp"
        imageAlt="BlueDot gradient banner"
        iconSrc="/images/logo/BlueDot_Impact_Icon_White.svg"
        iconAlt="BlueDot icon"
        noiseImageSrc="/images/agi-strategy/noise.webp"
      />
    </div>
  );
};

export default EventsPage;
