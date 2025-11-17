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

export type OverflowMenuItemProps = {
  id: string;
  label: ReactNode;
  onAction?: () => void;
  href?: string;
  target?: string;
};

// TODO support general button props here
export type OverflowMenuProps = {
  items: OverflowMenuItemProps[];
  buttonClassName?: string;
};

type MenuContentProps = {
  items: OverflowMenuItemProps[];
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
};

const DEFAULT_BUTTON_CLASS = 'flex items-center justify-center p-2 rounded-md hover:bg-gray-100 cursor-pointer';

const MenuContent: React.FC<MenuContentProps> = ({ items, isOpen, setIsOpen }) => {
  const isDesktop = useAboveBreakpoint(breakpoints.md);

  const handleAction = (key: React.Key) => {
    const item = items.find((i) => i.id === key);
    if (item?.onAction) {
      item.onAction();
      setIsOpen(false);
    }
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
            'block px-4 py-3 cursor-pointer hover:bg-gray-100 outline-none',
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
      <BottomDrawerModal isOpen={isOpen} setIsOpen={setIsOpen}>
        {menuContent}
      </BottomDrawerModal>
    );
  }

  return null;
};

export const OverflowMenu: React.FC<OverflowMenuProps> = ({
  items,
  buttonClassName,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <MenuTrigger isOpen={isOpen} onOpenChange={setIsOpen}>
      <Button
        className={buttonClassName || DEFAULT_BUTTON_CLASS}
      >
        <HiDotsVertical className="size-5" />
      </Button>
      <MenuContent items={items} isOpen={isOpen} setIsOpen={setIsOpen} />
    </MenuTrigger>
  );
};
