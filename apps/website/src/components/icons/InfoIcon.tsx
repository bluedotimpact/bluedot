export const InfoIcon = ({
  className,
  bgFill = '#1D4ED8',
  fill = 'white',
}: {
  className?: string;
  bgFill?: string;
  fill?: string;
}) => {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="none" className={className}>
      <circle cx="10" cy="10" r="10" fill={bgFill} />
      <path d="M10 14V9" stroke={fill} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="10" cy="6.5" r="0.75" fill={fill} />
    </svg>
  );
};
