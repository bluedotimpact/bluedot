import type { CourseTab } from './BlueDotTabV2';

type CourseListV2Props = {
  activeTab: CourseTab;
};

const StatusPill = ({ label, tone = 'neutral' }: { label: string; tone?: 'neutral' | 'success' | 'danger' }) => {
  const toneClass = {
    neutral: 'bg-bluedot-navy/10 text-bluedot-navy',
    success: 'bg-emerald-50 text-emerald-800',
    danger: 'bg-rose-50 text-rose-800',
  }[tone];
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-medium ${toneClass}`}>
      {label}
    </span>
  );
};

const DateStamp = ({ date, time }: { date: string; time: string }) => (
  <div
    aria-hidden
    className="flex flex-col items-center justify-center w-16 px-2 py-1 rounded-md border border-bluedot-navy/15 text-bluedot-navy shrink-0"
  >
    <span className="text-[11px] font-semibold leading-tight">{date}</span>
    <span className="text-[10px] text-bluedot-navy/70 leading-tight">{time}</span>
  </div>
);

const CourseListV2 = ({ activeTab }: CourseListV2Props) => (
  <section aria-label="Course list" className="flex flex-col gap-4">
    <p className="text-[11px] uppercase tracking-wide text-bluedot-navy/50">Showing: {activeTab}</p>

    <article aria-labelledby="course-card-1-heading" className="rounded-lg border border-bluedot-navy/15 bg-white overflow-hidden">
      <header className="flex items-center gap-3 p-4 border-b border-bluedot-navy/10">
        <div aria-hidden className="w-10 h-10 rounded-md bg-purple-100 flex items-center justify-center shrink-0">
          <span className="text-purple-700 text-sm">◧</span>
        </div>
        <div className="flex-1 min-w-0">
          <h3 id="course-card-1-heading" className="text-base font-semibold text-bluedot-navy">Technical AI Safety</h3>
          <p className="text-xs text-bluedot-navy/70">Wednesdays, 4:00 - 5:00 PM · Facilitated by Shivam Arora</p>
        </div>
        <button
          type="button"
          aria-label="More actions"
          className="w-8 h-8 rounded-md border border-bluedot-navy/15 text-bluedot-navy hover:bg-bluedot-navy/5 transition-colors"
        >
          ⋮
        </button>
        <button
          type="button"
          aria-label="Toggle expand"
          className="w-8 h-8 rounded-md border border-bluedot-navy/15 text-bluedot-navy hover:bg-bluedot-navy/5 transition-colors"
        >
          ⌄
        </button>
      </header>

      <ul className="divide-y divide-bluedot-navy/10">
        <li className="flex items-center gap-3 p-4">
          <DateStamp date="Apr 29" time="4:00 PM" />
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-semibold tracking-wide uppercase text-bluedot-navy/60">UNIT 1</p>
            <p className="text-sm font-semibold text-bluedot-navy">The technical challenge with AI</p>
          </div>
          <StatusPill label="✓ Attended" tone="neutral" />
        </li>
        <li className="flex items-center gap-3 p-4">
          <DateStamp date="Apr 29" time="4:00 PM" />
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-semibold tracking-wide uppercase text-bluedot-navy/60">UNIT 2</p>
            <p className="text-sm font-semibold text-bluedot-navy">Training safer models</p>
          </div>
          <StatusPill label="⊘ Absent" tone="neutral" />
          <button
            type="button"
            className="px-3 py-1.5 text-xs font-medium rounded-md bg-bluedot-normal text-white hover:bg-bluedot-darker transition-colors"
          >
            Reschedule
          </button>
        </li>
        <li className="flex items-center gap-3 p-4">
          <DateStamp date="Apr 29" time="4:00 PM" />
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-semibold tracking-wide uppercase text-bluedot-navy/60">UNIT 3</p>
            <p className="text-sm font-semibold text-bluedot-navy">Detecting danger</p>
          </div>
          <button
            type="button"
            className="px-3 py-1.5 text-xs font-medium rounded-md border border-bluedot-normal text-bluedot-normal hover:bg-bluedot-normal/5 transition-colors"
          >
            Reschedule
          </button>
          <button
            type="button"
            aria-label="More actions"
            className="w-8 h-8 rounded-md border border-bluedot-navy/15 text-bluedot-navy hover:bg-bluedot-navy/5 transition-colors"
          >
            ⋮
          </button>
        </li>
      </ul>
    </article>
  </section>
);

export default CourseListV2;
