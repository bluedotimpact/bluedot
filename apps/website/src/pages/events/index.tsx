import { useState } from 'react';
import {
  addQueryParam,
  Breadcrumbs,
  CTALinkOrButton,
  ErrorSection,
  P,
  ProgressDots,
  type BluedotRoute,
} from '@bluedot/ui';
import Head from 'next/head';
import NewsletterBanner from '../../components/homepage/NewsletterBanner';
import MarketingHero from '../../components/MarketingHero';
import { PageListGroup, PageListRow } from '../../components/PageListRow';
import { buildTimeDeltaString } from '../../components/events/eventsUtils';
import { ROUTES } from '../../lib/routes';
import type { Event } from '../../server/routers/luma';
import { trpc } from '../../utils/trpc';

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

const EventDateBadge = ({ event }: { event: Event }) => {
  return (
    <div className="flex size-[68px] shrink-0 flex-col overflow-hidden rounded-[12px] border border-bluedot-navy/10 bg-white">
      <div className="flex items-center justify-center bg-bluedot-normal px-2 py-1.5">
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

const EventsPage = () => {
  const { data: events, isLoading, error } = trpc.luma.getUpcomingEvents.useQuery();
  const [selectedFilter, setSelectedFilter] = useState<EventFilterKey>('all');
  const topCalendarUrl = addEventsPageUtm(LUMA_CALENDAR_URL, 'top-cta');
  const emptyCalendarUrl = addEventsPageUtm(LUMA_CALENDAR_URL, 'empty-cta');

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

  const renderEventRow = (event: Event) => {
    const eventLinkUrl = addEventsPageUtm(event.url, 'event-link');
    const meta = `${formatLocationLabel(event.location)} · ${buildTimeDeltaString(event)}`;
    return (
      <PageListRow
        key={event.id}
        href={eventLinkUrl}
        title={event.title}
        meta={meta}
        external
        ctaLabel="View on Luma"
        leadingSlot={<EventDateBadge event={event} />}
      />
    );
  };

  return (
    <div>
      <Head>
        <title>{`${CURRENT_ROUTE.title} | BlueDot Impact`}</title>
        <meta
          name="description"
          content="Browse upcoming BlueDot events, including reading groups, coffee chats, workshops, socials, and city meetups."
        />
      </Head>

      <MarketingHero
        title="Events"
        subtitle="Recurring groups, meetups, socials, and workshops for the BlueDot community."
      />
      <Breadcrumbs route={CURRENT_ROUTE} />

      <section className="section section-body events-featured-section">
        <div className="w-full flex flex-col gap-8">
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
            <div className="flex flex-col gap-10">
              {showFilters && (
                <div className="flex flex-wrap gap-2">
                  {availableFilters.map((filter) => {
                    const isActive = activeFilter === filter;

                    return (
                      <button
                        key={filter}
                        type="button"
                        onClick={() => setSelectedFilter(filter)}
                        className={isActive
                          ? 'inline-flex items-center justify-center rounded-md bg-bluedot-navy px-4 py-2 text-[15px] font-[450] tracking-[-0.3px] text-white'
                          : 'inline-flex items-center justify-center rounded-md bg-bluedot-navy/10 px-4 py-2 text-[15px] font-[450] tracking-[-0.3px] text-bluedot-navy transition-colors hover:bg-bluedot-navy/15'}
                        aria-pressed={isActive}
                      >
                        {FILTER_LABELS[filter]}
                      </button>
                    );
                  })}
                </div>
              )}

              <div className="flex flex-col gap-12">
                {groupedListEvents.length > 0 ? (
                  groupedListEvents.map((group) => (
                    <PageListGroup key={group.month} label={group.month}>
                      {group.events.map(renderEventRow)}
                    </PageListGroup>
                  ))
                ) : (
                  <P>No events match this filter right now.</P>
                )}
              </div>
            </div>
          )}

          {!isLoading && !error && upcomingEvents.length === 0 && (
            <div>
              <P>No upcoming events are showing right now. Check the Luma calendar directly for the latest updates.</P>
              <div className="mt-5">
                <CTALinkOrButton url={emptyCalendarUrl} target="_blank">
                  Open the full Luma calendar
                </CTALinkOrButton>
              </div>
            </div>
          )}
        </div>
      </section>

      <div className="w-full max-w-max-width mx-auto px-spacing-x mt-spacing-y mb-16">
        <NewsletterBanner />
      </div>
    </div>
  );
};

EventsPage.mainShrinkToContent = true;
EventsPage.pageRendersOwnNav = true;

export default EventsPage;
