import clsx from 'clsx';
import type React from 'react';
import { CloseIcon } from './icons/CloseIcon';

export type IconButtonProps = {
  open: boolean;
  setOpen: (open: boolean) => void;
  Icon: React.ReactNode;
  className?: string;
};

export const IconButton: React.FC<IconButtonProps> = ({
  open,
  setOpen,
  className,
  Icon,
}) => {
  return (
    <button
      type="button"
      onClick={() => setOpen(!open)}
      className={clsx('icon-button size-[32px] flex items-center justify-center hover:cursor-pointer', className)}
    >
      {open ? <CloseIcon size={20} className="close-icon" /> : Icon}
    </button>
  );
};

export default IconButton;
