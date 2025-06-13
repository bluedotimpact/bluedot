import { NavLinks } from './_NavLinks';
import { ExpandedSectionsState } from './utils';

export const DesktopNavLinks: React.FC<{
  expandedSections: ExpandedSectionsState;
  updateExpandedSections: (updates: Partial<ExpandedSectionsState>) => void;
  isScrolled: boolean;
}> = ({
  expandedSections,
  updateExpandedSections,
  isScrolled,
}) => {
  return (
    <NavLinks
      expandedSections={expandedSections}
      updateExpandedSections={updateExpandedSections}
      isScrolled={isScrolled}
      className="hidden lg:flex"
    />
  );
};
