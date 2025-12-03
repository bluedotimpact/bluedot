import React, {
  ReactNode,
} from 'react';
import {
  Dialog,
  Modal as AriaModal,
  ModalOverlay,
  Heading,
} from 'react-aria-components';
import { ClickTarget } from './ClickTarget';
import { breakpoints, useAboveBreakpoint } from './hooks/useBreakpoint';
import { BottomDrawerModal } from './BottomDrawerModal';
import { CloseIcon } from './icons/CloseIcon';

export type ModalProps = {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  title?: ReactNode;
  children: ReactNode;
  bottomDrawerOnMobile?: boolean;
  /** ariaLabel for case where `title` is not a string, otherwise prefer leaving blank (`title` will be used) */
  ariaLabel?: string;
};

const DesktopModal: React.FC<Omit<ModalProps, 'bottomDrawerOnMobile'>> = ({
  isOpen,
  setIsOpen,
  title,
  children,
  ariaLabel,
}) => {
  return (
    <ModalOverlay
      isDismissable
      isOpen={isOpen}
      onOpenChange={setIsOpen}
      className="fixed inset-0 z-60 overflow-y-auto bg-black/25 flex min-h-full items-center justify-center p-4 backdrop-blur-xs"
    >
      <AriaModal>
        <Dialog className="bg-white rounded-xl pb-2 shadow-xl w-full outline-none" aria-label={ariaLabel}>
          <div className="flex justify-between items-center py-3 px-6 border-b border-charcoal-light">
            {title && typeof title === 'string' ? <Heading slot="title" className="text-size-lg font-semibold flex-1">{title}</Heading> : title}
            <ClickTarget onClick={() => setIsOpen(false)} className="text-black rounded-[50%] p-1 -mr-2 hover:bg-gray-100 cursor-pointer">
              <CloseIcon size={20} />
            </ClickTarget>
          </div>

          <div className="overflow-y-auto p-6 max-h-[600px]">
            {children}
          </div>
        </Dialog>
      </AriaModal>
    </ModalOverlay>
  );
};

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  setIsOpen,
  title,
  children,
  bottomDrawerOnMobile = false,
  ariaLabel,
}) => {
  const isDesktop = useAboveBreakpoint(breakpoints.md);

  // Don't render anything until breakpoint is determined to avoid desktop flicker
  if (bottomDrawerOnMobile && isDesktop === null) {
    return null;
  }

  const shouldUseMobileDrawer = bottomDrawerOnMobile && !isDesktop;

  if (shouldUseMobileDrawer) {
    return (
      <BottomDrawerModal isOpen={isOpen} setIsOpen={setIsOpen} title={title} initialSize="fit-screen" ariaLabel={ariaLabel}>
        {children}
      </BottomDrawerModal>
    );
  }

  return (
    <DesktopModal isOpen={isOpen} setIsOpen={setIsOpen} title={title} ariaLabel={ariaLabel}>
      {children}
    </DesktopModal>
  );
};
