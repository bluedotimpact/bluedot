import React, { ReactNode, useState } from 'react';
import {
  MenuTrigger,
  Button,
  Popover,
  Menu,
  MenuItem,
} from 'react-aria-components';
import { HiDotsVertical } from 'react-icons/hi';
import clsx from 'clsx';
import { breakpoints, useAboveBreakpoint } from './hooks/useBreakpoint';
import { BottomDrawerModal } from './BottomDrawerModal';
import { cn } from './utils';

export type OverflowMenuItemProps = {
  id: string;
  label: ReactNode;
  onAction?: () => void;
  href?: string;
  target?: string;
};

export type OverflowMenuProps = {
  items: OverflowMenuItemProps[];
  buttonClassName?: string;
  ariaLabel?: string;
};

type MenuContentProps = {
  items: OverflowMenuItemProps[];
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
};

// Styled approximately as a 'secondary' CTALinkOrButton. Ideally this would have the
// same variant options as CTALinkOrButton and encourage users not to customise the styling.
// In practice our button styling is currently very inconsistent, so this is intended as
// basic placeholder styling with the expectation that consumers *should* customise it.
const DEFAULT_BUTTON_CLASS = 'flex items-center justify-center p-2 rounded-md hover:bg-gray-100 border border-bluedot-normal text-bluedot-normal hover:bg-bluedot-lighter cursor-pointer';

const MenuContent: React.FC<MenuContentProps> = ({ items, isOpen, setIsOpen }) => {
  const isDesktop = useAboveBreakpoint(breakpoints.md);

  const handleAction = (key: React.Key) => {
    const item = items.find((i) => i.id === key);
    if (item?.onAction) {
      item.onAction();
    }
    setIsOpen(false);
  };

  const menuContent = (
    <Menu className="flex flex-col outline-none w-full" onAction={handleAction}>
      {items.map((item) => (
        <MenuItem
          key={item.id}
          id={item.id}
          href={item.href}
          target={item.target}
          className={clsx(
            'block px-4 py-3 cursor-pointer outline-none',
            isDesktop ? 'hover:bg-gray-100' : 'hover:bg-gray-200 rounded-lg',
          )}
        >
          {item.label}
        </MenuItem>
      ))}
    </Menu>
  );

  if (isDesktop) {
    return (
      <Popover
        isOpen={isOpen}
        onOpenChange={setIsOpen}
        placement="bottom end"
        className="bg-white rounded-lg shadow-[0_4px_12px_rgba(0,0,0,0.08)] border border-charcoal-light overflow-hidden min-w-[200px]"
      >
        {menuContent}
      </Popover>
    );
  }

  if (isDesktop === false) {
    return (
      <BottomDrawerModal isOpen={isOpen} setIsOpen={setIsOpen} initialSize="fit-content">
        {menuContent}
      </BottomDrawerModal>
    );
  }

  return null;
};

export const OverflowMenu: React.FC<OverflowMenuProps> = ({
  items,
  buttonClassName,
  ariaLabel = 'More options',
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <MenuTrigger isOpen={isOpen} onOpenChange={setIsOpen}>
      <Button className={cn(DEFAULT_BUTTON_CLASS, buttonClassName)} aria-label={ariaLabel}>
        <HiDotsVertical className="size-5" />
      </Button>
      <MenuContent items={items} isOpen={isOpen} setIsOpen={setIsOpen} />
    </MenuTrigger>
  );
};
