import { type ReactNode } from 'react';
import type React from 'react';
import {
  Dialog,
  Modal as AriaModal,
  ModalOverlay,
} from 'react-aria-components';
import { ModalHeader } from './ModalHeader';
import { breakpoints, useAboveBreakpoint } from './hooks/useBreakpoint';
import { BottomDrawerModal } from './BottomDrawerModal';

export type ModalProps = {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  title?: ReactNode;
  children: ReactNode;
  bottomDrawerOnMobile?: boolean;
  /** ariaLabel for case where `title` is not a string, otherwise prefer leaving blank (`title` will be used) */
  ariaLabel?: string;
  /**
   * When false the dialog has no exit of its own: the close button is hidden and Escape, backdrop click
   * and (on mobile) drag do nothing. Use it while a request is in flight or in a terminal state; the body
   * must supply the way out, or close programmatically via `isOpen`.
   */
  isDismissable?: boolean;
};

const DesktopModal: React.FC<Omit<ModalProps, 'bottomDrawerOnMobile'>> = ({
  isOpen,
  setIsOpen,
  title,
  children,
  ariaLabel,
  isDismissable = true,
}) => {
  return (
    <ModalOverlay
      isDismissable={isDismissable}
      // react-aria's isDismissable only covers outside interaction, not the escape key
      isKeyboardDismissDisabled={!isDismissable}
      isOpen={isOpen}
      onOpenChange={setIsOpen}
      className="fixed inset-0 z-60 flex items-center justify-center bg-scrim p-4 backdrop-blur-xs"
    >
      <AriaModal className="w-full max-w-modal">
        <Dialog
          className="flex max-h-[calc(100dvh-2rem)] flex-col rounded-overlay bg-raised shadow-xl outline-none"
          aria-label={ariaLabel}
        >
          <ModalHeader
            title={title}
            isDismissable={isDismissable}
            onClose={() => setIsOpen(false)}
            className="px-8 pt-5 pb-4"
          />
          <div className="min-h-0 overflow-y-auto px-8 pt-4 pb-6">
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
  isDismissable,
}) => {
  const isDesktop = useAboveBreakpoint(breakpoints.md);

  // Don't render anything until breakpoint is determined to avoid desktop flicker
  if (bottomDrawerOnMobile && isDesktop === null) {
    return null;
  }

  const shouldUseMobileDrawer = bottomDrawerOnMobile && !isDesktop;

  if (shouldUseMobileDrawer) {
    return (
      <BottomDrawerModal isOpen={isOpen} setIsOpen={setIsOpen} title={title} initialSize="fit-screen" ariaLabel={ariaLabel} isDismissable={isDismissable}>
        {children}
      </BottomDrawerModal>
    );
  }

  return (
    <DesktopModal isOpen={isOpen} setIsOpen={setIsOpen} title={title} ariaLabel={ariaLabel} isDismissable={isDismissable}>
      {children}
    </DesktopModal>
  );
};
