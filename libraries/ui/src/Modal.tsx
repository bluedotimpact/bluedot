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
import { cn } from './utils';

export type ModalProps = {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  title?: ReactNode;
  titleClassName?: string;
  children: ReactNode;
  bottomDrawerOnMobile?: boolean;
};

const DesktopModal: React.FC<Omit<ModalProps, 'bottomDrawerOnMobile'>> = ({
  isOpen,
  setIsOpen,
  title,
  titleClassName,
  children,
}) => {
  return (
    <ModalOverlay
      isDismissable
      isOpen={isOpen}
      onOpenChange={setIsOpen}
      className="fixed inset-0 z-60 overflow-y-auto bg-black/25 flex min-h-full items-center justify-center p-4 backdrop-blur-xs"
    >
      <AriaModal>
        <Dialog className="bg-white rounded-lg shadow-xl w-full py-10 px-6 outline-none">
          <div className="flex justify-between items-center mb-4 px-4">
            {title && <Heading slot="title" className={cn('text-size-lg font-semibold', titleClassName)}>{title}</Heading>}
            <ClickTarget onClick={() => setIsOpen(false)} className="text-gray-500 hover:text-gray-700 cursor-pointer">
              <span className="text-2xl">&times;</span>
            </ClickTarget>
          </div>

          <div className="overflow-y-auto px-4 max-h-[600px]">
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
  titleClassName,
  children,
  bottomDrawerOnMobile = false,
}) => {
  const isDesktop = useAboveBreakpoint(breakpoints.md);

  // Don't render anything until breakpoint is determined to avoid desktop flicker
  if (bottomDrawerOnMobile && isDesktop === null) {
    return null;
  }

  const shouldUseMobileDrawer = bottomDrawerOnMobile && !isDesktop;

  if (shouldUseMobileDrawer) {
    return (
      <BottomDrawerModal isOpen={isOpen} setIsOpen={setIsOpen} title={title} titleClassName={titleClassName} initialSize="fit-screen">
        {children}
      </BottomDrawerModal>
    );
  }

  return (
    <DesktopModal isOpen={isOpen} setIsOpen={setIsOpen} title={title} titleClassName={titleClassName}>
      {children}
    </DesktopModal>
  );
};
