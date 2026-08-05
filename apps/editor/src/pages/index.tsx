import {
  Navigate,
  withAuth,
} from '@bluedot/ui';

const HomePage = withAuth(() => {
  return (
    <Navigate url="/jobs" />
  );
});

export default HomePage;
