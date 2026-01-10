export const SwitchUserIcon = ({
  className,
  size,
  stroke = 'currentColor',
}: {
  className?: string;
  size?: number;
  stroke?: string;
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path
        d="M12 15C14.0711 15 15.75 13.3211 15.75 11.25C15.75 9.17893 14.0711 7.5 12 7.5C9.92893 7.5 8.25 9.17893 8.25 11.25C8.25 13.3211 9.92893 15 12 15Z"
        stroke={stroke}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M5.98125 18.6909C6.54554 17.5794 7.40658 16.6459 8.46894 15.9938C9.5313 15.3418 10.7535 14.9966 12 14.9966C13.2465 14.9966 14.4687 15.3418 15.5311 15.9938C16.5934 16.6459 17.4545 17.5794 18.0187 18.6909"
        stroke={stroke}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M18.75 12L21 14.25L23.25 12"
        stroke={stroke}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M0.75 12L3 9.75L5.25 12"
        stroke={stroke}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M3 9.75V12C2.99929 13.9055 3.60337 15.762 4.72524 17.3022C5.84712 18.8424 7.42888 19.9868 9.24273 20.5706C11.0566 21.1543 13.0089 21.1474 14.8185 20.5506C16.6282 19.9539 18.2017 18.7982 19.3125 17.25"
        stroke={stroke}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M21 14.2499V11.9999C21.0007 10.0945 20.3966 8.23793 19.2748 6.69772C18.1529 5.15751 16.5711 4.01312 14.7573 3.42935C12.9434 2.84558 10.9911 2.85257 9.18147 3.44931C7.37185 4.04604 5.79832 5.20173 4.6875 6.74993"
        stroke={stroke}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};
