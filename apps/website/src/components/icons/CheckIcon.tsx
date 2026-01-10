export const CheckIcon = ({ className, stroke = 'currentColor' }: { className?: string; stroke?: string }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="30"
      height="30"
      viewBox="0 0 30 30"
      fill="none"
      className={className}
    >
      <path
        d="M25 7.5L11.25 21.25L5 15"
        stroke={stroke}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};
