import React from 'react';
import { RiLoader4Line } from 'react-icons/ri';
import { cn } from '@bluedot/ui';
import { UndoIcon } from '../../icons/UndoIcon';
import { CircledCheckmarkIcon } from '../../icons/CircledCheckmarkIcon';
import { ErrorIcon } from '../../icons/ErrorIcon';

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
    icon: <RiLoader4Line className="animate-spin -translate-y-[0.5px]" size={16} style={{ color: '#1641D9' }} />,
    text: 'Saving...',
  },
  saved: {
    icon: <CircledCheckmarkIcon className="-translate-y-[0.5px]" size={14} />,
    text: savedText,
  },
  error: {
    icon: <ErrorIcon size={14} className="-translate-y-[0.5px]" />,
    text: (onRetry) => (
      <span className="flex items-center gap-1">
        <span style={{ color: '#DC0000' }}>Couldn't save answer.</span>
        <button
          type="button"
          onClick={onRetry}
          style={{
            color: '#13132E',
            fontWeight: 500,
            background: 'none',
            border: 'none',
            padding: 0,
            cursor: 'pointer',
            textDecoration: 'underline',
            display: 'flex',
            alignItems: 'center',
            gap: '2px',
          }}
        >
          Retry
          <UndoIcon className="text-[#13132E] ml-0.5" />
        </button>
      </span>
    ),
    className: 'text-red-600',
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
        '-mt-[10px] pt-[10px] relative z-0 rounded-b-[10px] transition-opacity duration-200 border border-[0.5px] opacity-0',
        !isIdle && (isError
          ? 'opacity-100 bg-[rgba(220,0,0,0.05)] border-[rgba(220,0,0,0.1)]'
          : 'opacity-100 bg-[#F4F7FD] border-[rgba(34,68,187,0.1)]'),
      )}
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      <div className="flex items-center gap-[5px] w-full h-6 px-3 text-size-xxs font-medium text-bluedot-normal">
        {!isIdle && config?.icon}
        {!isIdle && text}
      </div>
    </div>
  );
};

export default SaveStatusIndicator;
