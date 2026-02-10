import { NavLinks } from './_NavLinks';
import { type ExpandedSectionsState } from './utils';

export const DesktopNavLinks: React.FC<{
  expandedSections: ExpandedSectionsState;
  updateExpandedSections: (updates: Partial<ExpandedSectionsState>) => void;
  onColoredBackground?: boolean;
}> = ({
  expandedSections,
  updateExpandedSections,
  onColoredBackground = false,
}) => {
  return (
    <NavLinks
      expandedSections={expandedSections}
      updateExpandedSections={updateExpandedSections}
      onColoredBackground={onColoredBackground}
      className="hidden lg:flex"
    />
  );
};
