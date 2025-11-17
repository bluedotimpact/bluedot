import { NavLinks } from './_NavLinks';
import { ExpandedSectionsState } from './utils';

export const DesktopNavLinks: React.FC<{
  expandedSections: ExpandedSectionsState;
  updateExpandedSections: (updates: Partial<ExpandedSectionsState>) => void;
  isHomepage?: boolean;
}> = ({
  expandedSections,
  updateExpandedSections,
  isHomepage = false,
}) => {
  return (
    <NavLinks
      expandedSections={expandedSections}
      updateExpandedSections={updateExpandedSections}
      isHomepage={isHomepage}
      className="hidden lg:flex"
    />
  );
};
