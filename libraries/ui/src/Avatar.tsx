import { useState } from 'react';
import { cn } from './utils';

const sizeClasses = {
  small: 'size-11 text-size-md',
  medium: 'size-16 text-size-lg',
  // 32px initials: text-size-xl is responsive (32px → 48px at the md breakpoint),
  // and avatar initials must stay fixed, so use an arbitrary value instead.
  large: 'size-20 text-[2rem]',
} as const;

export type AvatarProps = {
  name: string;
  /** Design-system ramp: small 44px / medium 64px / large 80px. Defaults to small. */
  size?: keyof typeof sizeClasses;
  imageSrc?: string;
  className?: string;
};

/**
 * Decorative by design — every current usage renders the person's name beside it.
 * When used standalone (no adjacent name), put the accessible name on the
 * wrapping button/link, not here.
 */
export const Avatar: React.FC<AvatarProps> = ({ name, size = 'small', imageSrc, className }) => {
  // Fall back to initials when the image is missing OR fails to load (e.g. a
  // formula-generated headshot URL that 404s/500s for a person with no photo).
  const [failedSrc, setFailedSrc] = useState<string | null>(null);

  if (imageSrc && imageSrc !== failedSrc) {
    return (
      <img
        src={imageSrc}
        alt=""
        className={cn('shrink-0 rounded-full object-cover', sizeClasses[size], className)}
        onError={() => setFailedSrc(imageSrc)}
      />
    );
  }

  return (
    <div
      aria-hidden
      className={cn(
        'bg-bluedot-normal flex shrink-0 items-center justify-center rounded-full font-bold text-white',
        sizeClasses[size],
        className,
      )}
    >
      {getInitials(name)}
    </div>
  );
};

/** Extract up to two uppercase initials from a person's name. Examples: 'Clara Ndubuisi' → 'CN', 'cher' → 'C'. */
export function getInitials(name: string): string {
  const parts = name.split(/\s+/).filter(Boolean).slice(0, 2);
  const chars = parts.map((part) => Array.from(part)[0] ?? '');
  return chars.join('').toUpperCase();
}
