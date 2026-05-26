import clsx from 'clsx';
import { getInitials } from '../../lib/utils';

type Props = {
  name: string;
  imageSrc?: string;
  className?: string;
};

const AlumniAvatar = ({ name, imageSrc, className }: Props) => {
  if (imageSrc) {
    return (
      <img
        src={imageSrc}
        alt={name}
        className={clsx('rounded-full object-cover shrink-0', className)}
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
