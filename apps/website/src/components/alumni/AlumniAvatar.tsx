import clsx from 'clsx';
import { useState } from 'react';
import { getInitials } from '../../lib/utils';

type Props = {
  name: string;
  imageSrc?: string;
  className?: string;
};

const AlumniAvatar = ({ name, imageSrc, className }: Props) => {
  // Fall back to initials when the image is missing OR fails to load (e.g. a
  // formula-generated headshot URL that 404s/500s for a person with no photo).
  const [failedSrc, setFailedSrc] = useState<string | null>(null);

  if (imageSrc && imageSrc !== failedSrc) {
    return (
      <img
        src={imageSrc}
        alt={name}
        className={clsx('rounded-full object-cover shrink-0', className)}
        onError={() => setFailedSrc(imageSrc)}
      />
    );
  }

  return (
    <div
      role="img"
      aria-label={name}
      className={clsx(
        'rounded-full bg-bluedot-normal flex items-center justify-center text-white font-bold shrink-0',
        className,
      )}
    >
      {getInitials(name)}
    </div>
  );
};

export default AlumniAvatar;
