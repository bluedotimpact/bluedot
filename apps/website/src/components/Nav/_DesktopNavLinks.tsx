import { NavLinks } from './_NavLinks';
import { ExpandedSectionsState } from './utils';

export const DesktopNavLinks: React.FC<{
  courses: { title: string; url: string; isNew?: boolean }[];
  expandedSections: ExpandedSectionsState;
  updateExpandedSections: (updates: Partial<ExpandedSectionsState>) => void;
  isScrolled: boolean;
}> = ({
  courses,
  expandedSections,
  updateExpandedSections,
  isScrolled,
}) => {
  return (
    <NavLinks
      courses={courses}
      expandedSections={expandedSections}
      updateExpandedSections={updateExpandedSections}
      isScrolled={isScrolled}
      className="hidden lg:flex"
    />
  );
};
