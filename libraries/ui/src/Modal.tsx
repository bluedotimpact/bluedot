import { type ReactNode } from 'react';
import type React from 'react';
import {
  Dialog,
  Modal as AriaModal,
  ModalOverlay,
} from 'react-aria-components';
import { ClickTarget } from './ClickTarget';
import { ModalTitle } from './ModalTitle';
import { breakpoints, useAboveBreakpoint } from './hooks/useBreakpoint';
import { BottomDrawerModal } from './BottomDrawerModal';
import { CloseIcon } from './icons/CloseIcon';
import { cn } from './utils';

export type ModalProps = {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  title?: ReactNode;
  children: ReactNode;
  bottomDrawerOnMobile?: boolean;
  desktopHeaderClassName?: string;
  /** ariaLabel for case where `title` is not a string, otherwise prefer leaving blank (`title` will be used) */
  ariaLabel?: string;
  /**
   * When false, the user can't dismiss the modal via the escape key, clicking outside it, or (on mobile) dragging it down.
   * Closing it programmatically always works, as does the desktop header close button. The mobile bottom drawer has no
   * built-in close button, so render your own close/cancel control in `children` when using it.
   */
  isDismissable?: boolean;
  centerTitle?: boolean;
};

const DesktopModal: React.FC<Omit<ModalProps, 'bottomDrawerOnMobile'>> = ({
  isOpen,
  setIsOpen,
  title,
  children,
  desktopHeaderClassName,
  ariaLabel,
  isDismissable = true,
  centerTitle,
}) => {
  return (
    <ModalOverlay
      isDismissable={isDismissable}
      // react-aria's isDismissable only covers outside interaction, not the escape key
      isKeyboardDismissDisabled={!isDismissable}
      isOpen={isOpen}
      onOpenChange={setIsOpen}
      className="fixed inset-0 z-60 overflow-y-auto bg-black/25 flex min-h-full items-center justify-center p-4 backdrop-blur-xs"
    >
      <AriaModal>
        <Dialog className="bg-white rounded-xl shadow-xl w-full pb-8 outline-none" aria-label={ariaLabel}>
          <div className={cn('flex justify-between items-center mb-4 pt-10 pl-8 pr-6', desktopHeaderClassName)}>
            {title && typeof title === 'string' ? <ModalTitle className={centerTitle ? 'mx-auto' : undefined}>{title}</ModalTitle> : title}
            <ClickTarget onClick={() => setIsOpen(false)} aria-label="Close" className="text-black rounded-full p-1 hover:bg-gray-100 cursor-pointer">
              <CloseIcon size={20} />
            </ClickTarget>
          </div>

          <div className="overflow-y-auto px-8 max-h-[600px]">
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
  desktopHeaderClassName,
  ariaLabel,
  isDismissable,
  centerTitle,
}) => {
  const isDesktop = useAboveBreakpoint(breakpoints.md);

  // Don't render anything until breakpoint is determined to avoid desktop flicker
  if (bottomDrawerOnMobile && isDesktop === null) {
    return null;
  }

  const shouldUseMobileDrawer = bottomDrawerOnMobile && !isDesktop;

  if (shouldUseMobileDrawer) {
    return (
      <BottomDrawerModal isOpen={isOpen} setIsOpen={setIsOpen} title={title} initialSize="fit-screen" ariaLabel={ariaLabel} isDismissable={isDismissable} centerTitle={centerTitle}>
        {children}
      </BottomDrawerModal>
    );
  }

  return (
    <DesktopModal isOpen={isOpen} setIsOpen={setIsOpen} title={title} ariaLabel={ariaLabel} desktopHeaderClassName={desktopHeaderClassName} isDismissable={isDismissable} centerTitle={centerTitle}>
      {children}
    </DesktopModal>
  );
};
