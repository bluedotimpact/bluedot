import {
  Navigate,
  withAuth,
} from '@bluedot/ui';

const HomePage = withAuth(() => {
  return (
    <Navigate url="/blogs" />
  );
});

export default HomePage;
