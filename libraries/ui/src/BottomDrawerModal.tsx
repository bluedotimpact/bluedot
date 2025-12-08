import React, {
  useState, useEffect, useRef,
} from 'react';
import {
  Modal as AriaModal,
  ModalOverlay,
} from 'react-aria-components';
import {
  animate,
  AnimatePresence,
  motion,
  useMotionValue,
  useDragControls,
} from 'framer-motion';
import clsx from 'clsx';
import type { ModalProps } from './Modal';

// Layout constants
const NAV_HEIGHT = 64;
const SHEET_MARGIN = NAV_HEIGHT + 12;
const CLOSE_VELOCITY_THRESHOLD = 500;
const CLOSE_POSITION_THRESHOLD = 0.8;
const MIN_CONTENT_HEIGHT = 100;

export type BottomDrawerModalProps = Omit<ModalProps, 'bottomDrawerOnMobile'> & {
  /**
   * - 'fit-content': Open the minimum amount to display the `children`
   * - 'fit-screen': Open enough to fill most of the screen, independent of the dimensions of `children`
   */
  initialSize: 'fit-content' | 'fit-screen'
};

export const BottomDrawerModal: React.FC<BottomDrawerModalProps> = ({
  isOpen,
  setIsOpen,
  title,
  initialSize,
  children,
  ariaLabel,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [isFullyExpanded, setIsFullyExpanded] = useState(false);
  const dragControls = useDragControls();

  // Ref to measure children content height
  const contentRef = useRef<HTMLDivElement>(null);

  const windowHeight = typeof window !== 'undefined' ? window.innerHeight : 800;

  // Modal positioning calculations
  const availableHeight = windowHeight - SHEET_MARGIN;
  const halfOpenY = availableHeight * 0.15; // Initial position - shows ~85% of content
  const closedY = availableHeight; // Fully closed position

  // Always start from closed position, the useEffect below will animate to an open position if needed
  const y = useMotionValue(closedY);

  // Reset on modal state changes
  const prevIsOpen = useRef<boolean | null>(null);
  useEffect(() => {
    if (prevIsOpen.current === isOpen) return;

    if (isOpen) {
      setIsClosing(false);

      // Calculate optimal opening position based on content height
      requestAnimationFrame(() => {
        const contentHeight = contentRef.current?.scrollHeight ?? 0;
        const headerHeight = title ? 80 : 40;
        const totalNeededHeight = Math.max(contentHeight, MIN_CONTENT_HEIGHT) + headerHeight + 16;
        const contentBasedY = availableHeight - totalNeededHeight;

        // Use the larger y value (less expansion) = min height
        const targetY = initialSize === 'fit-screen' ? halfOpenY : Math.max(halfOpenY, contentBasedY);

        animate(y, targetY, { duration: 0.3, ease: [0.32, 0.72, 0, 1] });
      });
    } else {
      setIsDragging(false);
      setIsClosing(false);
    }

    prevIsOpen.current = isOpen;
  }, [halfOpenY, isOpen, y, availableHeight, title, initialSize]);

  // Listen to y motion value changes to update isFullyExpanded (adds a drop shadow)
  useEffect(() => {
    const unsubscribe = y.on('change', (latest) => {
      const shouldBeFullyExpanded = latest < 20;
      if (isFullyExpanded !== shouldBeFullyExpanded) {
        setIsFullyExpanded(shouldBeFullyExpanded);
      }
    });
    return unsubscribe;
  }, [y, isFullyExpanded]);

  const handleClose = () => {
    if (!isClosing) {
      setIsClosing(true);
      animate(y, closedY, {
        duration: 0.3,
        ease: [0.32, 0.72, 0, 1],
      });
      // setIsOpen(false) will be called by AnimatePresence onExitComplete
    }
  };

  const titleIsString = typeof title === 'string';

  return (
    <ModalOverlay
      isDismissable
      isOpen={isOpen}
      onOpenChange={(open) => !open && handleClose()}
      className="fixed inset-0 z-60 flex min-h-full items-center justify-center"
    >
      <AriaModal>
        <AnimatePresence onExitComplete={() => setIsOpen(false)}>
          {!isClosing && (
            <>
              <motion.div
                className="fixed inset-0 bg-black/25 backdrop-blur-xs"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                onClick={handleClose}
              />
              {/* Modal Container */}
              <motion.div
                className="bg-color-canvas fixed bottom-0 inset-x-0 rounded-t-[24px] shadow-lg will-change-transform flex flex-col"
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
                aria-labelledby={title && titleIsString ? 'mobile-modal-title' : undefined}
                aria-label={ariaLabel}
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
                  <div className={clsx(
                    'flex flex-col bg-[#FCFAF7] border-b-hairline border-[rgba(19,19,46,0.2)] rounded-t-[24px] transition-shadow duration-300',
                    isFullyExpanded && 'shadow-[0_4px_12px_rgba(0,0,0,0.08)]',
                  )}
                  >
                    {/* Drag handle */}
                    <div
                      className="flex justify-center pt-1 pb-4 cursor-grab active:cursor-grabbing touch-none"
                      onPointerDown={(e) => dragControls.start(e)}
                    >
                      <div className="w-[30px] h-1 bg-[rgba(19,19,46,0.3)] rounded-[3px]" />
                    </div>

                    {title && (
                      <div className="flex items-center justify-between px-5 pb-4">
                        {titleIsString ? (
                          <h2 id="mobile-modal-title" className="text-size-lg font-semibold text-[#13132E]">
                            {title}
                          </h2>
                        ) : title}
                      </div>
                    )}
                  </div>

                  {/* Content / Scrollable Area */}
                  <div
                    data-modal-content
                    className={clsx(
                      'flex flex-col flex-1 overflow-y-auto p-4 w-full items-center',
                      isDragging && 'pointer-events-none',
                    )}
                  >
                    <div className="w-full flex justify-center" ref={contentRef}>
                      {children}
                    </div>
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
            </>
          )}
        </AnimatePresence>
      </AriaModal>
    </ModalOverlay>
  );
};
