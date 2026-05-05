import type { Course, CourseRegistration, Group } from '@bluedot/db';
import DiscussionList from './DiscussionList';

type CourseListRowProps = {
  course: Course;
  courseRegistration: CourseRegistration;
  group: Group | null;
  facilitatorNames: string[];
};

const buildSubtitle = (group: Group | null, facilitatorNames: string[]): string => {
  const parts: string[] = [];
  if (group?.startTimeUtc) {
    const date = new Date(group.startTimeUtc * 1000);
    const weekday = date.toLocaleDateString('en-US', { weekday: 'long' });
    const time = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    parts.push(`${weekday}s, ${time}`);
  }
  if (facilitatorNames.length > 0) {
    parts.push(`Facilitated by ${facilitatorNames.join(', ')}`);
  }
  return parts.join(' · ');
};

const CourseListRow = ({ course, group, facilitatorNames }: CourseListRowProps) => {
  const subtitle = buildSubtitle(group, facilitatorNames);

  return (
    <article className="rounded-lg border border-bluedot-navy/15 bg-white overflow-hidden">
      <header className="flex items-center gap-3 p-4 border-b border-bluedot-navy/10">
        <div aria-hidden className="w-10 h-10 rounded-md bg-purple-100 flex items-center justify-center shrink-0">
          <span className="text-purple-700 text-sm">◧</span>
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-semibold text-bluedot-navy">{course.title}</h3>
          {subtitle && <p className="text-xs text-bluedot-navy/70">{subtitle}</p>}
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
};

export default CourseListRow;
