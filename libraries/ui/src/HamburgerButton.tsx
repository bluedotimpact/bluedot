import clsx from 'clsx';
import React from 'react';

const HamburgerIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48" fill="none" className={className}>
    <path d="M16 18H32" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <path d="M16 24H32" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <path d="M16 30H32" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

const CloseIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48" fill="none" className={className}>
    <path d="M18 29.3135L29.3137 17.9998" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <path d="M18 18.3135L29.3137 29.6272" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

export type HamburgerButtonProps = {
  open: boolean,
  setOpen: (open: boolean) => void,
  className?: string,
};

export const HamburgerButton: React.FC<HamburgerButtonProps> = ({
  open,
  setOpen,
  className,
}) => {
  return (
    <button
      type="button"
      onClick={() => setOpen(!open)}
      className={clsx('hamburger-button', className)}
    >
      {open ? <CloseIcon className="close-icon" /> : <HamburgerIcon className="hamburger-icon" />}
    </button>
  );
};

export default HamburgerButton;
