export type CourseTab = 'in-progress' | 'upcoming' | 'past-courses';

const TABS: { id: CourseTab; label: string }[] = [
  { id: 'in-progress', label: 'In Progress' },
  { id: 'upcoming', label: 'Upcoming' },
  { id: 'past-courses', label: 'Past Courses' },
];

type BlueDotTabV2Props = {
  activeTab: CourseTab;
  onTabChange: (tab: CourseTab) => void;
};

const BlueDotTabV2 = ({ activeTab, onTabChange }: BlueDotTabV2Props) => (
  <div role="tablist" aria-label="Course filter" className="flex gap-2">
    {TABS.map((tab) => {
      const isActive = activeTab === tab.id;
      return (
        <button
          key={tab.id}
          type="button"
          role="tab"
          aria-selected={isActive}
          onClick={() => onTabChange(tab.id)}
          className={`px-4 py-1.5 text-xs font-medium rounded-full border transition-colors ${
            isActive
              ? 'bg-bluedot-darker text-white border-bluedot-darker'
              : 'bg-white text-bluedot-navy border-bluedot-navy/20 hover:bg-bluedot-navy/5'
          }`}
        >
          {tab.label}
        </button>
      );
    })}
  </div>
);

export default BlueDotTabV2;
