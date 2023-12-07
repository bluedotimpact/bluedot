type ButtonProps = React.PropsWithChildren<{
  className?: string;
  appName: string;
}>;

export const Button = ({ children, className, appName }: ButtonProps) => {
  return (
    <button
      className={className}
      // eslint-disable-next-line no-alert
      onClick={() => alert(`Hello from your ${appName} app!`)}
      type="button"
    >
      {children}
    </button>
  );
};
