import { NavLinks } from './_NavLinks';
import { ExpandedSectionsState } from './utils';

export const DesktopNavLinks: React.FC<{
  expandedSections: ExpandedSectionsState;
  updateExpandedSections: (updates: Partial<ExpandedSectionsState>) => void;
  isScrolled: boolean;
  isHomepage?: boolean;
}> = ({
  expandedSections,
  updateExpandedSections,
  isScrolled,
  isHomepage = false,
}) => {
  return (
    <NavLinks
      expandedSections={expandedSections}
      updateExpandedSections={updateExpandedSections}
      isScrolled={isScrolled}
      isHomepage={isHomepage}
      className="hidden lg:flex"
    />
  );
};
