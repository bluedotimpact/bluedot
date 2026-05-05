const NextDiscussionCard = () => (
  <section aria-labelledby="next-discussion-heading">
    <h2 id="next-discussion-heading" className="text-sm font-semibold text-bluedot-navy mb-3">
      Next discussion
    </h2>
    <article className="flex items-center gap-4 p-4 rounded-lg border border-bluedot-navy/15 bg-white">
      <div
        aria-hidden
        className="flex flex-col items-center justify-center w-14 h-14 rounded-md overflow-hidden border border-bluedot-navy/15 shrink-0"
      >
        <span className="text-[10px] font-semibold uppercase bg-bluedot-normal text-white w-full text-center py-0.5">
          Apr
        </span>
        <span className="text-lg font-semibold text-bluedot-navy leading-none mt-1">28</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[11px] font-semibold tracking-wide uppercase text-bluedot-normal">UNIT 3</p>
        <h3 className="text-base font-semibold text-bluedot-navy">Detecting danger</h3>
        <p className="text-xs text-bluedot-navy/70">April 28, 2026, 4:00 - 5:00 PM</p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <button
          type="button"
          className="px-3 py-1.5 text-xs font-medium rounded-md border border-bluedot-normal text-bluedot-normal hover:bg-bluedot-normal/5 transition-colors"
        >
          Reschedule
        </button>
        <button
          type="button"
          className="px-3 py-1.5 text-xs font-medium rounded-md bg-bluedot-normal text-white hover:bg-bluedot-darker transition-colors"
        >
          Prep for discussion
        </button>
      </div>
    </article>
  </section>
);

export default NextDiscussionCard;
