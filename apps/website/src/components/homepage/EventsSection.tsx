import { CTALinkOrButton, ProgressDots } from '@bluedot/ui';
import EventAgenda from '../events/EventAgenda';
import { trpc } from '../../utils/trpc';
import { ROUTES } from '../../lib/routes';

const EVENTS_SECTION_URL = `${ROUTES.events.url}?utm_source=website&utm_campaign=events-section`;
const PREVIEW_EVENT_COUNT = 4;

const EventsSection = () => {
  const { data: events, isLoading, error } = trpc.luma.getUpcomingEvents.useQuery();
  const displayEvents = (events ?? []).slice(0, PREVIEW_EVENT_COUNT);

  return (
    <section
      id="upcoming-events"
      className="w-full bg-white py-12 bd-md:py-16 lg:py-20 xl:py-24"
      aria-labelledby="events-section-heading"
    >
      <div className="section-base">
        <div className="mb-8 text-center">
          <h2 id="events-section-heading" className="bluedot-h2 font-medium tracking-tighter">Join an upcoming event</h2>
          <p className="mx-auto mt-4 max-w-[620px] text-size-sm leading-relaxed text-bluedot-navy/70">Reading groups, workshops, and meetups. Connect with the BlueDot community online and around the world.</p>
        </div>
        {isLoading && <div className="py-8"><ProgressDots /></div>}
        {error && (
          <p role="alert" className="py-6 text-size-sm leading-relaxed text-bluedot-navy/70">
            We couldn’t load the events. <a className="text-bluedot-normal underline" href="https://lu.ma/bluedotevents?utm_source=website&utm_campaign=events-section&utm_content=error-cta">Check the calendar on Luma ↗</a>
          </p>
        )}
        {!isLoading && !error && displayEvents.length > 0 && (
          <>
            <p className="mb-6 text-size-xxs leading-relaxed text-bluedot-navy/60">Online events in your time. In-person events in venue time.</p>
            <EventAgenda events={displayEvents} campaign="events-section" />
          </>
        )}
        {!isLoading && !error && displayEvents.length === 0 && (
          <p className="py-6 text-size-sm leading-relaxed text-bluedot-navy/70">More events are on the way. Explore our calendar for the latest updates.</p>
        )}
        <div className="mt-8 flex justify-center">
          <CTALinkOrButton url={EVENTS_SECTION_URL} variant="secondary">See all events →</CTALinkOrButton>
        </div>
      </div>
    </section>
  );
};

export default EventsSection;
