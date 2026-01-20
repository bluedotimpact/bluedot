import React from 'react';
import clsx from 'clsx';
import { COURSE_CONFIG } from '../../lib/constants';

type CourseIconSize = 'small' | 'medium' | 'large' | 'xlarge';

type CourseIconProps = {
  courseSlug: string;
  size?: CourseIconSize;
  className?: string;
};

/* Transform explanation: translate to center, scale to match image size, translate back by path center point (21.3, 18.7) */
const SIZE_CONFIG = {
  small: {
    container: 'size-8', // 32x32
    image: 'size-5', // 20px
    svg: {
      width: 32, height: 32, viewBox: '0 0 32 32', transform: 'translate(16, 16) scale(0.9) translate(-21.3, -18.7)',
    },
    badge: 'size-3 text-[7px]',
  },
  medium: {
    container: 'size-10', // 40x40
    image: 'size-6', // 24px
    svg: {
      width: 40, height: 40, viewBox: '0 0 40 40', transform: 'translate(20, 20) scale(1.1) translate(-21.3, -18.7)',
    },
    badge: 'size-3.5 text-[8px]',
  },
  large: {
    container: 'size-11', // 44x44
    image: 'size-7', // 28px
    svg: {
      width: 44, height: 44, viewBox: '0 0 44 44', transform: 'translate(22, 22) scale(1.27) translate(-21.3, -18.7)',
    },
    badge: 'size-4 text-[9px]',
  },
  xlarge: {
    container: 'size-16', // 64x64
    image: 'size-10', // 40px
    svg: {
      width: 64, height: 64, viewBox: '0 0 64 64', transform: 'translate(32, 32) scale(1.8) translate(-21.3, -18.7)',
    },
    badge: 'size-5 text-[11px]',
  },
} as const;

export const CourseIcon: React.FC<CourseIconProps> = ({
  courseSlug,
  size = 'medium',
  className,
}) => {
  const courseConfig = COURSE_CONFIG[courseSlug];
  const iconSrc = courseConfig?.icon;
  const iconBackground = courseConfig?.iconBackground || '#1144cc';
  const badge = courseConfig?.badge;
  const config = SIZE_CONFIG[size];

  // If course has a specific icon, use it
  if (iconSrc) {
    return (
      <div
        className={clsx(
          config.container,
          'relative rounded-[8px] flex items-center justify-center flex-shrink-0',
          className,
        )}
        style={{ backgroundColor: iconBackground }}
      >
        <img src={iconSrc} alt="" className={config.image} />
        {badge && (
          <span
            className={clsx(
              config.badge,
              'absolute -top-0.5 -right-0.5 bg-white rounded-full flex items-center justify-center font-bold text-[#13132e] ring-1 ring-black/5',
            )}
          >
            {badge}
          </span>
        )}
      </div>
    );
  }

  // Fallback to generic BlueDot icon
  return (
    <svg
      width={config.svg.width}
      height={config.svg.height}
      viewBox={config.svg.viewBox}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <rect className="fill-bluedot-normal" width={config.svg.width} height={config.svg.height} rx="8" />
      <g transform={config.svg.transform}>
        <path d="M31.9941 21.4938L28.4941 24.9938C28.3299 25.158 28.1072 25.2502 27.875 25.2502C27.6428 25.2502 27.4201 25.158 27.2559 24.9938C27.0918 24.8296 26.9995 24.6069 26.9995 24.3747C26.9995 24.1425 27.0918 23.9198 27.2559 23.7556L29.263 21.7497H19.487L13.362 27.8747H16.5C16.7321 27.8747 16.9546 27.9669 17.1187 28.131C17.2828 28.2951 17.375 28.5176 17.375 28.7497C17.375 28.9818 17.2828 29.2043 17.1187 29.3684C16.9546 29.5325 16.7321 29.6247 16.5 29.6247H11.25C11.0179 29.6247 10.7954 29.5325 10.6313 29.3684C10.4672 29.2043 10.375 28.9818 10.375 28.7497V23.4997C10.375 23.2676 10.4672 23.0451 10.6313 22.881C10.7954 22.7169 11.0179 22.6247 11.25 22.6247C11.4821 22.6247 11.7046 22.7169 11.8687 22.881C12.0328 23.0451 12.125 23.2676 12.125 23.4997V26.6377L18.25 20.5127V10.7367L16.2441 12.7438C16.0799 12.908 15.8572 13.0002 15.625 13.0002C15.3928 13.0002 15.1701 12.908 15.0059 12.7438C14.8418 12.5796 14.7495 12.3569 14.7495 12.1247C14.7495 11.8925 14.8418 11.6698 15.0059 11.5056L18.5059 8.00564C18.5872 7.92429 18.6837 7.85976 18.7899 7.81572C18.8961 7.77169 19.01 7.74902 19.125 7.74902C19.24 7.74902 19.3538 7.77169 19.4601 7.81572C19.5663 7.85976 19.6628 7.92429 19.7441 8.00564L23.2441 11.5056C23.4082 11.6698 23.5005 11.8925 23.5005 12.1247C23.5005 12.3569 23.4082 12.5796 23.2441 12.7438C23.0799 12.908 22.8572 13.0002 22.625 13.0002C22.3928 13.0002 22.1701 12.908 22.0059 12.7438L20 10.7367V19.9997H29.263L27.2559 17.9938C27.0918 17.8296 26.9995 17.6069 26.9995 17.3747C26.9995 17.1425 27.0918 16.9198 27.2559 16.7556C27.4201 16.5915 27.6428 16.4992 27.875 16.4992C28.1072 16.4992 28.3299 16.5915 28.4941 16.7556L31.9941 20.2556C32.0754 20.3369 32.14 20.4334 32.184 20.5396C32.228 20.6459 32.2507 20.7597 32.2507 20.8747C32.2507 20.9897 32.228 21.1036 32.184 21.2098C32.14 21.316 32.0754 21.4125 31.9941 21.4938Z" fill="white" />
      </g>
    </svg>
  );
};
