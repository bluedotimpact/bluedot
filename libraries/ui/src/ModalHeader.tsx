import { type ReactNode, useEffect, useRef } from 'react';
import { IconButton } from './IconButton';
import { ModalTitle } from './ModalTitle';
import { CloseIcon } from './icons/CloseIcon';
import { cn } from './utils';

export type ModalHeaderProps = {
  title?: ReactNode;
  /** Set when the surrounding dialog names itself via a manual `aria-labelledby` */
  titleId?: string;
  isDismissable: boolean;
  onClose: () => void;
  className?: string;
};

/** Shared header for the desktop dialog and the mobile sheet: title, close button and divider. */
export const ModalHeader = ({
  title,
  titleId,
  isDismissable,
  onClose,
  className,
}: ModalHeaderProps) => {
  const titleIsString = typeof title === 'string';
  const headingRef = useRef<HTMLHeadingElement>(null);

  // Move focus to the new title when the dialog swaps state in place (confirm -> success)
  const prevTitle = useRef(title);
  useEffect(() => {
    if (titleIsString && prevTitle.current !== title) {
      headingRef.current?.focus();
    }

    prevTitle.current = title;
  }, [title, titleIsString]);

  if (!title && !isDismissable) {
    return null;
  }

  return (
    <div className={cn('flex items-start gap-3 border-b border-subtle', className)}>
      {titleIsString && isDismissable && <span aria-hidden className="size-8 shrink-0" />}
      {titleIsString ? (
        <ModalTitle
          ref={headingRef}
          id={titleId}
          tabIndex={-1}
          className="flex min-h-8 min-w-0 flex-1 items-center justify-center text-center outline-none"
        >
          {title}
        </ModalTitle>
      ) : (
        <div className="min-h-8 min-w-0 flex-1 self-center">{title}</div>
      )}
      {isDismissable && (
        <IconButton aria-label="Close" onClick={onClose} className="-mr-2">
          <CloseIcon size={20} aria-hidden />
        </IconButton>
      )}
    </div>
  );
};
