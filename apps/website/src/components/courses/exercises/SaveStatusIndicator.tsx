import React from 'react';
import { RiLoader4Line } from 'react-icons/ri';
import { cn } from '@bluedot/ui';
import { UndoIcon } from '../../icons/UndoIcon';

type SaveStatus = 'idle' | 'typing' | 'saving' | 'saved' | 'error';

type SaveStatusIndicatorProps = {
  status: SaveStatus;
  id: string;
  onRetry?: () => void;
  savedText?: string; // Custom text for saved state
};

// Custom checkmark icon component
const CheckmarkIcon = () => (
  <div
    style={{
      boxSizing: 'border-box',
      width: '16px',
      height: '16px',
      border: '1.25px solid var(--bluedot-normal)',
      borderRadius: '666.667px',
      position: 'relative',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}
  >
    <svg
      width="9"
      height="9"
      viewBox="0 0 9 9"
      fill="none"
      style={{
        position: 'absolute',
      }}
    >
      <path
        className="stroke-bluedot-normal"
        d="M1 4.5L3.5 7L8 1.5"
        strokeWidth="1.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  </div>
);

// Custom error icon component
const ErrorIcon = () => (
  <div
    style={{
      boxSizing: 'border-box',
      width: '16px',
      height: '16px',
      border: '1.25px solid #DC0000',
      borderRadius: '666.667px',
      position: 'relative',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}
  >
    <svg
      width="10"
      height="10"
      viewBox="0 0 10 10"
      fill="none"
      style={{
        position: 'absolute',
      }}
    >
      <path
        d="M2 2L8 8M8 2L2 8"
        stroke="#DC0000"
        strokeWidth="1.25"
        strokeLinecap="round"
      />
    </svg>
  </div>
);

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
    icon: <RiLoader4Line className="animate-spin" size={16} style={{ color: '#1641D9' }} />,
    text: 'Saving...',
  },
  saved: {
    icon: <CheckmarkIcon />,
    text: savedText,
  },
  error: {
    icon: <ErrorIcon />,
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
        '-mt-[10px] pt-[10px] relative z-0 rounded-b-[10px] transition-all duration-200',
        isError ? 'bg-[rgba(220,0,0,0.03)]' : 'bg-[#F4F7FD] border-[0.5px] border-[rgba(34,68,187,0.1)] border-t-0',
      )}
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      <div className="flex items-center gap-1.5 w-full h-7.5 px-3 text-size-xxs font-medium text-bluedot-normal">
        {!isIdle && config?.icon}
        {!isIdle && text}
      </div>
    </div>
  );
};

export default SaveStatusIndicator;
