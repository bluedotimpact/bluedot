import { useEffect, useRef, type ReactNode } from 'react';
export const Dialog = ({
  title,
  children,
  onClose,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
}) => {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const el = ref.current!;
    el.showModal();
    return () => el.close();
  }, []);
  return (
    <dialog
      ref={ref}
      className="ts-dialog"
      aria-label={title}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="ts-dialog-head">
        <h2>{title}</h2>
        <button type="button" onClick={onClose} aria-label={`Close ${title}`}>
          ×
        </button>
      </div>
      <div className="ts-dialog-body">{children}</div>
    </dialog>
  );
};

export const ExternalLink = ({
  url,
  children,
}: {
  url?: string;
  children: ReactNode;
}) => {
  if (!url) return null;
  try {
    if (!['http:', 'https:'].includes(new URL(url).protocol)) return null;
  } catch {
    return null;
  }

  return (
    <a href={url} target="_blank" rel="noopener noreferrer">
      {children} ↗
    </a>
  );
};

export const words = (value: string) =>
  value.replaceAll('_', ' ').replaceAll('programmes', 'programs');
export const basis = {
  evidence: 'Evidence',
  no_data: 'Unknown',
  negative: 'Adverse evidence',
};
