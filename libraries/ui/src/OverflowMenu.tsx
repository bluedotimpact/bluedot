import { type ReactNode } from 'react';
import type React from 'react';
import { useState } from 'react';
import {
  MenuTrigger,
  Button,
  Popover,
  Menu,
  MenuItem,
} from 'react-aria-components';
import { FaEllipsisVertical } from 'react-icons/fa6';
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
  disabled?: boolean;
};

export type OverflowMenuProps = {
  items: OverflowMenuItemProps[];
  buttonClassName?: string;
  'aria-label'?: string;
  /** If not provided, defaults to vertical ellipsis icon */
  trigger?: ReactNode;
};

type MenuContentProps = {
  items: OverflowMenuItemProps[];
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
};

// Trigger button styled as secondary. Menu items are the primary actions
const DEFAULT_BUTTON_CLASS = 'flex items-center justify-center p-2 rounded-md border border-accent text-accent hover:bg-accent-subtle cursor-pointer';

const MenuContent = ({ items, isOpen, setIsOpen }: MenuContentProps) => {
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
          href={item.disabled ? undefined : item.href}
          target={item.target}
          isDisabled={item.disabled}
          className={clsx(
            'block px-4 py-3 outline-none',
            item.disabled && 'cursor-default text-disabled',
            !item.disabled && 'cursor-pointer',
            !item.disabled && (isDesktop ? 'hover:bg-tint' : 'hover:bg-tint active:bg-active rounded-lg'),
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
        className="bg-raised rounded-surface shadow-[0_4px_12px_rgba(0,0,0,0.08)] border overflow-hidden min-w-[200px]"
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

export const OverflowMenu = ({
  items,
  buttonClassName,
  'aria-label': ariaLabel = 'More options',
  trigger,
}: OverflowMenuProps) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <MenuTrigger isOpen={isOpen} onOpenChange={setIsOpen}>
      <Button className={cn(DEFAULT_BUTTON_CLASS, buttonClassName)} aria-label={ariaLabel}>
        {trigger ?? <FaEllipsisVertical aria-hidden="true" className="size-5" />}
      </Button>
      <MenuContent items={items} isOpen={isOpen} setIsOpen={setIsOpen} />
    </MenuTrigger>
  );
};
