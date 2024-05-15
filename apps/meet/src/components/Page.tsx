import { Box } from '@bluedot/ui';

export const Page: React.FC<React.PropsWithChildren> = ({ children }) => {
  return (
    <div className="tw-preflight bluedot-base">
      <div className="py-16 px-4">
        <Box className="max-w-3xl mx-auto">
          <div className="m-12">
            {children}
          </div>
        </Box>
      </div>
    </div>
  );
};
