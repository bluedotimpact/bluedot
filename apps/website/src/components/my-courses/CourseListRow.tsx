import DiscussionList from './DiscussionList';

const CourseListRow = () => (
  <article className="rounded-lg border border-bluedot-navy/15 bg-white overflow-hidden">
    <header className="flex items-center gap-3 p-4 border-b border-bluedot-navy/10">
      <div aria-hidden className="w-10 h-10 rounded-md bg-purple-100 flex items-center justify-center shrink-0">
        <span className="text-purple-700 text-sm">◧</span>
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="text-base font-semibold text-bluedot-navy">Technical AI Safety</h3>
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
    <DiscussionList />
  </article>
);

export default CourseListRow;
