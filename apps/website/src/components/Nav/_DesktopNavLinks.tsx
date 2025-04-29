import { NavLinks } from './_NavLinks';
import { ExpandedSectionsState } from './Nav';

export const DesktopNavLinks: React.FC<{
    expandedSections: ExpandedSectionsState;
    updateExpandedSections: (updates: Partial<ExpandedSectionsState>) => void;
    courses: { title: string; url: string; isNew?: boolean }[];
    isScrolled: boolean;
  }> = ({
    expandedSections,
    updateExpandedSections,
    courses,
    isScrolled,
  }) => {
    return (
      <NavLinks
        className="desktop-nav-links__nav-links hidden lg:flex"
        expandedSections={expandedSections}
        updateExpandedSections={updateExpandedSections}
        courses={courses}
        isScrolled={isScrolled}
      />
    );
  };