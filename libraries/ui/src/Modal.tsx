import React, { ReactNode, useState, useEffect } from 'react';
import {
  Dialog,
  Modal as AriaModal,
  ModalOverlay,
  Heading,
} from 'react-aria-components';
import {
  animate,
  AnimatePresence,
  motion,
  useMotionValue,
  useDragControls,
} from 'framer-motion';
import clsx from 'clsx';
import { ClickTarget } from './ClickTarget';
import { breakpoints, useAboveBreakpoint } from './hooks/useBreakpoint';

export type ModalProps = {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  title: string;
  children: ReactNode;
  bottomDrawerOnMobile?: boolean;
};

const DesktopModal: React.FC<Omit<ModalProps, 'bottomDrawerOnMobile'>> = ({
  isOpen,
  setIsOpen,
  title,
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
            <Heading slot="title" className="text-size-lg font-semibold">{title}</Heading>
            <ClickTarget onClick={() => setIsOpen(false)} className="text-gray-500 hover:text-gray-700">
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

// Layout constants
const NAV_HEIGHT = 64;
const SHEET_MARGIN = NAV_HEIGHT + 12;
const CLOSE_VELOCITY_THRESHOLD = 500;
const CLOSE_POSITION_THRESHOLD = 0.8;

const MobileDrawerModal: React.FC<Omit<ModalProps, 'bottomDrawerOnMobile'>> = ({
  isOpen,
  setIsOpen,
  title,
  children,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const dragControls = useDragControls();

  const windowHeight = typeof window !== 'undefined' ? window.innerHeight : 800;

  // Modal positioning calculations
  const availableHeight = windowHeight - SHEET_MARGIN;
  const halfOpenY = availableHeight * 0.15; // Initial position - shows ~85% of content
  const closedY = availableHeight; // Fully closed position

  // Always start from closed position, even if isOpen is initially true
  const y = useMotionValue(closedY);

  // Reset on modal state changes
  useEffect(() => {
    if (!isOpen) {
      setIsDragging(false);
      setIsClosing(false);
    } else {
      setIsClosing(false);
    }
  }, [isOpen]);

  // Animate modal on open/close - always slide up from bottom
  useEffect(() => {
    if (isOpen) {
      // Slide up from bottom
      animate(y, halfOpenY, { duration: 0.3, ease: [0.32, 0.72, 0, 1] });
    } else if (!isOpen) {
      // Slide down to bottom
      animate(y, closedY, { duration: 1.0, ease: [0.32, 0.72, 0, 1] });
    }
  }, [isOpen, halfOpenY, closedY, y]);

  const handleClose = () => {
    if (!isClosing) {
      setIsClosing(true);
      animate(y, closedY, {
        duration: 0.3,
        ease: [0.32, 0.72, 0, 1],
      }).then(() => {
        setIsOpen(false);
      });
    }
  };

  return (
    <ModalOverlay
      isDismissable
      data-is-open={isOpen}
      isOpen={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          handleClose();
        }
      }}
      className={clsx(
        'fixed inset-0 z-60 flex min-h-full items-center justify-center backdrop-blur-xs bg-black/25 transition-opacity duration-300 ease-out',
        isOpen ? 'opacity-100' : 'opacity-0',
      )}
    >
      <AriaModal>
        <AnimatePresence>
          {/* Modal Container */}
          <motion.div
            className="bg-white fixed bottom-0 inset-x-0 rounded-t-[24px] shadow-lg will-change-transform flex flex-col"
            transition={{
              duration: 0.3,
              ease: [0.32, 0.72, 0, 1],
            }}
            style={{
              y,
              height: availableHeight,
            }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="mobile-modal-title"
            tabIndex={-1}
            drag="y"
            dragListener={false}
            dragControls={dragControls}
            dragConstraints={{
              top: 0,
              bottom: closedY,
            }}
            dragElastic={0}
            onDragStart={() => {
              setIsDragging(true);
            }}
            onDragEnd={(e, info) => {
              setIsDragging(false);

              if (isClosing) return;

              const velocity = info.velocity.y;
              const currentY = y.get();
              const closeThreshold = closedY * CLOSE_POSITION_THRESHOLD;

              if (velocity > CLOSE_VELOCITY_THRESHOLD || currentY > closeThreshold) {
                handleClose();
              }
            }}
          >
            <div className="h-full flex flex-col rounded-t-[24px] overflow-hidden">
              {/* Header Section with Drag Handle */}
              <div className="flex flex-col bg-gray-50 border-b border-gray-200 rounded-t-[24px]">
                {/* Drag handle */}
                <div
                  className="flex justify-center pt-1 pb-3 cursor-grab active:cursor-grabbing touch-none"
                  onPointerDown={(e) => dragControls.start(e)}
                >
                  <div className="w-[30px] h-1 bg-gray-400 rounded-[3px]" />
                </div>

                <div className="flex items-center justify-between px-5 pb-4">
                  <h2 id="mobile-modal-title" className="text-size-lg font-semibold text-gray-900">
                    {title}
                  </h2>
                  <ClickTarget onClick={handleClose} className="text-gray-500 hover:text-gray-700">
                    <span className="text-2xl">&times;</span>
                  </ClickTarget>
                </div>
              </div>

              {/* Content / Scrollable Area */}
              <div
                data-modal-content
                className={clsx(
                  'flex flex-col flex-1 overflow-y-auto p-4 w-full items-center',
                  isDragging && 'pointer-events-none',
                )}
              >
                {children}
              </div>
              {/*
                * Spacer div: The parent can overflow off the screen, fill the off-screen space
                * so the content fills exactly the on-screen area.
                */}
              <motion.div
                style={{ height: y, minHeight: 0 }}
                className="flex-shrink-0"
              />
            </div>
          </motion.div>
        </AnimatePresence>
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
}) => {
  const isDesktop = useAboveBreakpoint(breakpoints.md);

  // Don't render anything until breakpoint is determined to avoid desktop flicker
  if (bottomDrawerOnMobile && isDesktop === null) {
    return null;
  }

  const shouldUseMobileDrawer = bottomDrawerOnMobile && !isDesktop;

  if (shouldUseMobileDrawer) {
    return (
      <MobileDrawerModal isOpen={isOpen} setIsOpen={setIsOpen} title={title}>
        {children}
      </MobileDrawerModal>
    );
  }

  return (
    <DesktopModal isOpen={isOpen} setIsOpen={setIsOpen} title={title}>
      {children}
    </DesktopModal>
  );
};
