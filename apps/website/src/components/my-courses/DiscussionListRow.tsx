type DiscussionStatus = 'attended' | 'absent' | 'upcoming';

type DiscussionListRowProps = {
  date: string;
  time: string;
  unit: string;
  title: string;
  status: DiscussionStatus;
};

const DiscussionListRow = ({
  date, time, unit, title, status,
}: DiscussionListRowProps) => (
  <li className="flex items-center gap-3 p-4">
    <div
      aria-hidden
      className="flex flex-col items-center justify-center w-16 px-2 py-1 rounded-md border border-bluedot-navy/15 text-bluedot-navy shrink-0"
    >
      <span className="text-[11px] font-semibold leading-tight">{date}</span>
      <span className="text-[10px] text-bluedot-navy/70 leading-tight">{time}</span>
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-[11px] font-semibold tracking-wide uppercase text-bluedot-navy/60">{unit}</p>
      <p className="text-sm font-semibold text-bluedot-navy">{title}</p>
    </div>
    {status === 'attended' && (
      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-medium bg-bluedot-navy/10 text-bluedot-navy">
        ✓ Attended
      </span>
    )}
    {status === 'absent' && (
      <>
        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-medium bg-bluedot-navy/10 text-bluedot-navy">
          ⊘ Absent
        </span>
        <button
          type="button"
          className="px-3 py-1.5 text-xs font-medium rounded-md bg-bluedot-normal text-white hover:bg-bluedot-darker transition-colors"
        >
          Reschedule
        </button>
      </>
    )}
    {status === 'upcoming' && (
      <>
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
      </>
    )}
  </li>
);

export default DiscussionListRow;
