import { useState } from 'react';
import {
  addQueryParam, Breadcrumbs, CTALinkOrButton, ProgressDots,
} from '@bluedot/ui';
import Head from 'next/head';
import MarketingHero from '../../components/MarketingHero';
import { ROUTES } from '../../lib/routes';
import PageNewsletter from '../../components/PageNewsletter';
import { formatLocationLabel } from '../../components/events/eventsUtils';
import EventAgenda from '../../components/events/EventAgenda';
import type { Event } from '../../server/routers/luma';
import { trpc } from '../../utils/trpc';

const LUMA_CALENDAR_URL = 'https://lu.ma/bluedotevents';
const PAGE_SIZE = 20;
const FILTERS = { all: 'All events', online: 'Online', 'in-person': 'In person' } as const;
type EventFilter = keyof typeof FILTERS;

const trackedUrl = (url: string, content: string) => {
  const withSource = addQueryParam(url, 'utm_source', 'website');
  const withCampaign = addQueryParam(withSource, 'utm_campaign', 'events-page');
  return addQueryParam(withCampaign, 'utm_content', content);
};

const isInPerson = (event: Event) => !['ONLINE', 'LOCATION TBC'].includes(event.location);

const EventsPage = () => {
  const { data: events, isLoading, error } = trpc.luma.getUpcomingEvents.useQuery();
  const [filter, setFilter] = useState<EventFilter>('all');
  const [location, setLocation] = useState('all');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const upcomingEvents = events ?? [];
  const locations = [...new Set(upcomingEvents.filter(isInPerson)
    .map((event) => event.location).filter((value) => value !== 'IN PERSON'))].sort();
  const filteredEvents = upcomingEvents.filter((event) => {
    if (filter === 'online' && event.location !== 'ONLINE') return false;
    if (filter === 'in-person' && !isInPerson(event)) return false;
    return location === 'all' || event.location === location;
  });
  const visibleEvents = filteredEvents.slice(0, visibleCount);

  return (
    <div>
      <Head>
        <title>Events | BlueDot Impact</title>
        <meta name="description" content="Meet the BlueDot community. Explore upcoming AI safety reading groups, workshops, socials, and meetups online and around the world." />
      </Head>
      <MarketingHero
        title="Events"
        subtitle="Meet, learn, and work on AI safety with the BlueDot community."
      />
      <Breadcrumbs route={ROUTES.events} />
      <main className="bg-slate-50/70 pb-16">
        <section aria-label="Upcoming events" className="section-base pt-6 sm:pt-8">
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
            <div className="flex flex-wrap gap-1 rounded-xl border border-bluedot-navy/10 bg-white p-1" aria-label="Event format">
              {Object.entries(FILTERS).map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  aria-pressed={filter === key}
                  onClick={() => {
                    setFilter(key as EventFilter);
                    setLocation('all');
                    setVisibleCount(PAGE_SIZE);
                  }}
                  className={`flex-1 whitespace-nowrap rounded-lg px-2 py-2.5 text-size-xs font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-bluedot-normal sm:flex-none sm:px-4 ${filter === key ? 'bg-bluedot-navy text-white' : 'text-bluedot-navy/70 hover:bg-slate-100'}`}
                >{label}</button>
              ))}
            </div>
            <div className="flex flex-wrap items-center gap-4">
              {filter !== 'online' && locations.length > 0 && (
                <label className="flex items-center gap-3 text-size-xs text-bluedot-navy/70">
                  Location
                  <select
                    value={location}
                    onChange={(e) => {
                      setLocation(e.target.value);
                      setVisibleCount(PAGE_SIZE);
                    }}
                    className="min-w-0 flex-1 rounded-lg border border-bluedot-navy/15 bg-white px-3 py-2.5 text-bluedot-navy sm:min-w-44"
                  >
                    <option value="all">Everywhere</option>
                    {locations.map((value) => <option key={value} value={value}>{formatLocationLabel(value)}</option>)}
                  </select>
                </label>
              )}
              <CTALinkOrButton url={trackedUrl(LUMA_CALENDAR_URL, 'top-cta')} target="_blank" variant="secondary">Follow on Luma ↗</CTALinkOrButton>
            </div>
          </div>
          <div className="mb-6 flex flex-col gap-1 text-size-xxs leading-relaxed text-bluedot-navy/60 sm:flex-row sm:justify-between">
            <p role="status">{!isLoading && !error ? `${filteredEvents.length} upcoming ${filteredEvents.length === 1 ? 'event' : 'events'}` : 'Upcoming events'}</p>
            <p>Online events in your time. In-person events in venue time.</p>
          </div>
          {isLoading && <div className="py-12"><ProgressDots /></div>}
          {error && <p role="alert" className="py-8">We couldn’t load the events. <a className="underline" href={trackedUrl(LUMA_CALENDAR_URL, 'error-cta')}>See the calendar on Luma ↗</a></p>}
          {!isLoading && !error && (
            <>
              <EventAgenda events={visibleEvents} />
              {filteredEvents.length === 0 && (
                <div className="rounded-2xl border border-bluedot-navy/10 bg-white p-8 text-center">
                  <p className="text-size-md font-semibold">{upcomingEvents.length ? 'No events match these filters.' : 'More events are on the way.'}</p>
                  <p className="mt-3 text-size-sm text-bluedot-navy/70">{upcomingEvents.length ? 'Try another location or browse all upcoming events.' : 'Follow our Luma calendar to hear about the next one.'}</p>
                  {upcomingEvents.length > 0 ? (
                    <button type="button" className="mt-5 text-bluedot-normal underline" onClick={() => {
                      setFilter('all');
                      setLocation('all');
                      setVisibleCount(PAGE_SIZE);
                    }}>Clear filters</button>
                  ) : <a href={trackedUrl(LUMA_CALENDAR_URL, 'empty-cta')} className="mt-5 inline-block text-bluedot-normal underline">Open the Luma calendar ↗</a>}
                </div>
              )}
              {visibleCount < filteredEvents.length && (
                <div className="mt-8 flex justify-center">
                  <button type="button" onClick={() => setVisibleCount((count) => count + PAGE_SIZE)} className="rounded-lg border border-bluedot-navy/20 bg-white px-6 py-3 text-size-sm font-medium hover:border-bluedot-normal">Show more events ({filteredEvents.length - visibleCount} remaining)</button>
                </div>
              )}
            </>
          )}
        </section>
      </main>
      <PageNewsletter />
    </div>
  );
};

EventsPage.pageRendersOwnNav = true;
export default EventsPage;
