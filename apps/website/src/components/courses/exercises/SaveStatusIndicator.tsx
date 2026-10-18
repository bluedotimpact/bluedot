import type React from 'react';
import {
  FaCircleCheck, FaCircleNotch, FaCircleXmark, FaRotateLeft,
} from 'react-icons/fa6';
import { cn } from '@bluedot/ui';

type SaveStatus = 'idle' | 'typing' | 'saving' | 'saved' | 'error';

type SaveStatusIndicatorProps = {
  status: SaveStatus;
  id: string;
  onRetry?: () => void;
  savedText?: string; // Custom text for saved state
};

// Configuration object for status content (without saved text, which is dynamic)
const getStatusConfig = (savedText: string): Record<SaveStatus, {
  icon?: React.ReactNode;
  text: string | ((onRetry?: () => void) => React.ReactNode);
  className?: string;
}> => ({
  idle: {
    text: '',
  },
  typing: {
    text: '', // No typing message shown - auto-saves after 5 seconds
  },
  saving: {
    icon: <FaCircleNotch aria-hidden="true" className="size-3 animate-spin -translate-y-[0.5px] text-accent" />,
    text: 'Saving...',
  },
  saved: {
    icon: <FaCircleCheck aria-hidden="true" className="size-3.5 -translate-y-[0.5px] text-accent" />,
    text: savedText,
  },
  error: {
    icon: <FaCircleXmark aria-hidden="true" className="size-4 -translate-y-[0.5px] text-[#DC0000]" />,
    text: (onRetry) => (
      <span className="flex items-center gap-1">
        <span className="text-[#DC0000]">Couldn't save answer.</span>
        <button
          type="button"
          onClick={onRetry}
          className="flex items-center gap-0.5 font-medium text-primary underline cursor-pointer"
        >
          Retry
          <FaRotateLeft aria-hidden="true" className="size-4 text-primary ml-0.5" />
        </button>
      </span>
    ),
    className: 'text-error-fg',
  },
});

const SaveStatusIndicator: React.FC<SaveStatusIndicatorProps> = ({
  status,
  id,
  onRetry,
  savedText = 'Answer saved', // Default to "Answer saved" for backward compatibility
}) => {
  const statusConfig = getStatusConfig(savedText);
  const config = statusConfig[status];
  const isError = status === 'error';
  const isIdle = status === 'idle' || status === 'typing';
  const textConfig = config?.text;
  const text = typeof textConfig === 'function' ? textConfig(onRetry) : textConfig;

  return (
    <div
      id={id}
      className={cn(
        '-mt-2.5 pt-[10px] relative z-0 rounded-b-[10px] transition-opacity duration-200 border-[0.5px] border-t-0 opacity-0',
        !isIdle && (isError
          ? 'opacity-100 bg-[rgba(220,0,0,0.05)] border-[rgba(220,0,0,0.1)]'
          : 'opacity-100 bg-[#F4F7FD] border-[rgba(34,68,187,0.1)]'),
      )}
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      <div className="flex items-center gap-[5px] w-full h-6 px-3 text-size-xs font-medium text-accent">
        {!isIdle && config?.icon}
        {!isIdle && text}
      </div>
    </div>
  );
};

export default SaveStatusIndicator;
