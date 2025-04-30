export const ProgressDots: React.FC = () => {
  return (
    <div className="progress-dots flex justify-center space-x-2 my-6">
      <span className="size-2 bg-bluedot-normal rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
      <span className="size-2 bg-bluedot-normal rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
      <span className="size-2 bg-bluedot-normal rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
    </div>
  );
};
