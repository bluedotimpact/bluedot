import { useState } from 'react';
import { addQueryParam } from '@bluedot/ui';
import {
  HiArrowUpRight, HiOutlineCalendarDays, HiOutlineMapPin, HiOutlineVideoCamera,
} from 'react-icons/hi2';
import { buildTimeDeltaString, formatEventDate, formatLocationLabel } from './eventsUtils';
import type { Event } from '../../server/routers/luma';

const EventCard = ({ event, campaign, titleHeading: TitleHeading }: {
  event: Event;
  campaign: 'events-page' | 'events-section';
  titleHeading: 'h3' | 'h4';
}) => {
  const [imageFailed, setImageFailed] = useState(false);
  const online = event.location === 'ONLINE';
  const LocationIcon = online ? HiOutlineVideoCamera : HiOutlineMapPin;
  return (
    <li>
      <a
        href={addQueryParam(addQueryParam(addQueryParam(event.url, 'utm_source', 'website'), 'utm_campaign', campaign), 'utm_content', 'event-link')}
        target="_blank"
        rel="noopener noreferrer"
        className="group flex items-center gap-4 rounded-2xl border border-bluedot-navy/10 bg-white p-4 transition-colors hover:border-bluedot-normal/40 hover:bg-bluedot-light/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-bluedot-normal sm:gap-6 sm:p-5"
      >
        <div className="size-20 shrink-0 overflow-hidden rounded-xl bg-bluedot-light sm:size-28">
          {event.coverUrl && !imageFailed ? (
            <img src={event.coverUrl} alt="" width={112} height={112} loading="lazy" onError={() => setImageFailed(true)} className="size-full object-cover" />
          ) : (
            <div className="flex size-full items-center justify-center text-bluedot-normal"><HiOutlineCalendarDays size={32} aria-hidden="true" /></div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-size-xxs font-medium leading-relaxed text-bluedot-navy/65 sm:text-size-xs">{buildTimeDeltaString(event)}</p>
          <TitleHeading className="mt-1 text-size-sm font-semibold leading-snug tracking-tight text-bluedot-navy group-hover:text-bluedot-normal sm:text-size-md">{event.title}</TitleHeading>
          <p className="mt-2 flex items-center gap-1.5 text-size-xs leading-relaxed text-bluedot-navy/65">
            <LocationIcon className="shrink-0" size={16} aria-hidden="true" />
            {formatLocationLabel(event.location)}
          </p>
        </div>
        <HiArrowUpRight className="hidden shrink-0 text-bluedot-navy/40 group-hover:text-bluedot-normal sm:block" size={22} aria-hidden="true" />
      </a>
    </li>
  );
};

/** The same dated event cards on the homepage preview and complete calendar. */
const EventAgenda = ({ events, campaign = 'events-page' }: {
  events: Event[];
  campaign?: 'events-page' | 'events-section';
}) => {
  const groups: { date: string; events: Event[] }[] = [];
  for (const event of events) {
    const date = formatEventDate(event);
    const lastGroup = groups[groups.length - 1];
    if (lastGroup?.date === date) lastGroup.events.push(event);
    else groups.push({ date, events: [event] });
  }

  const DateHeading = campaign === 'events-section' ? 'h3' : 'h2';
  const titleHeading = campaign === 'events-section' ? 'h4' : 'h3';
  return (
    <div className="flex flex-col gap-7">
      {groups.map((group, index) => (
        <div key={`${group.date}-${index}`} className="grid gap-3 sm:grid-cols-[160px_minmax(0,1fr)] sm:gap-8">
          <DateHeading className="pt-2 text-size-sm font-semibold leading-relaxed text-bluedot-navy">{group.date}</DateHeading>
          <ul className="flex flex-col gap-3">
            {group.events.map((event) => <EventCard key={event.id} event={event} campaign={campaign} titleHeading={titleHeading} />)}
          </ul>
        </div>
      ))}
    </div>
  );
};

export default EventAgenda;
