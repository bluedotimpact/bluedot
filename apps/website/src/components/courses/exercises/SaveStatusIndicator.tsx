import React from 'react';
import { RiLoader4Line } from 'react-icons/ri';

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
          <svg width="17" height="16" viewBox="0 0 17 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <g clipPath="url(#clip0_955_5635)">
              <path d="M2 3.49994V6.49994M2 6.49994H5M2 6.49994L4.61063 4.11056C5.37508 3.34625 6.34782 2.82415 7.40729 2.60951C8.46677 2.39487 9.56601 2.4972 10.5677 2.90372C11.5693 3.31024 12.429 4.00291 13.0392 4.8952C13.6494 5.78749 13.9832 6.83982 13.9988 7.92071C14.0144 9.0016 13.7111 10.0631 13.1268 10.9726C12.5426 11.8821 11.7033 12.5993 10.7137 13.0345C9.72422 13.4698 8.62838 13.6037 7.56316 13.4197C6.49793 13.2357 5.51055 12.7419 4.72438 11.9999" stroke="#13132E" strokeWidth="1.25" strokeLinecap="square" />
            </g>
            <defs>
              <clipPath id="clip0_955_5635">
                <rect width="16" height="16" fill="white" transform="translate(0.5)" />
              </clipPath>
            </defs>
          </svg>
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
  // Hide the indicator when status is idle or typing
  if (status === 'idle' || status === 'typing') return null;

  // Get the config with the custom saved text
  const statusConfig = getStatusConfig(savedText);
  const config = statusConfig[status];

  if (!config) return null;

  const isError = status === 'error';
  const text = typeof config.text === 'function' ? config.text(onRetry) : config.text;

  return (
    <div
      id={id}
      className="flex items-center gap-2 text-size-sm font-medium transition-all duration-200"
      style={{
        boxSizing: 'border-box',
        padding: '22px 24px 14px',
        width: '100%',
        height: '54px',
        background: isError
          ? 'linear-gradient(0deg, rgba(220, 0, 0, 0.05), rgba(220, 0, 0, 0.05)), rgba(255, 255, 255, 0.5)'
          : '#F0F5FD',
        border: isError
          ? 'none'
          : '0.5px solid rgba(34, 68, 187, 0.15)',
        borderRadius: '0px 0px 10px 10px',
        marginTop: '-10px',
        color: 'var(--bluedot-normal)',
        zIndex: 0,
      }}
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      {config.icon}
      {text}
    </div>
  );
};

export default SaveStatusIndicator;
