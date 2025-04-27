import { useState } from 'react';
import {
  Button, CardButton, ErrorSection, LegacyText, Link, ProgressDots, withAuth,
} from '@bluedot/ui';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { useQueryClient } from '@tanstack/react-query';
import { client } from '../lib/queryClient';

const AuthedPage = withAuth(({ auth, setAuth }) => {
  const [count, setCount] = useState(0);
  // const queryClient = useQueryClient();
  // const { mutate } = client.createCourse.useMutation({
  //   onSuccess: () => {
  //     queryClient.invalidateQueries({ queryKey: ['courses'] });
  //   },
  // });

  return (
    <div className="mx-8">
      <LegacyText.H1>Authed page</LegacyText.H1>
      <LegacyText.P>Here's the token we got: <code className="select-all">{auth.token}</code> (view on <Link url={`https://jwt.io/#debugger-io?token=${auth.token}`}>jwt.io</Link>)</LegacyText.P>
      <LegacyText.P>It expires at: {new Date(auth.expiresAt * 1000).toISOString()}</LegacyText.P>
      <Button onPress={() => setCount((c) => c + 1)}>
        count is {count}
      </Button>
      {/* <H2>Courses</H2>
      <CourseListView />
      <H2>Create course</H2>
      <Button onPress={() => { mutate({ body: {}, headers: { authorization: '' } }); }}>Create</Button> */}
      <LegacyText.H2>Logout</LegacyText.H2>
      <Button onPress={() => setAuth(null)}>Logout</Button>
    </div>
  );
});
export default AuthedPage;

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const CourseListView: React.FC = () => {
  const { data, isLoading, error } = client.listCourses.useQuery(['courses'], { headers: { authorization: '' } });

  if (isLoading) {
    return <ProgressDots />;
  }

  if (error) {
    return <ErrorSection error={error} />;
  }

  return (
    <div className="grid md:grid-cols-4 gap-4">
      {data?.body.map((course) => (
        // eslint-disable-next-line no-alert
        <CardButton key={course.courseId} onPress={() => alert('test')}>
          <LegacyText.H2>{course.name}</LegacyText.H2>
        </CardButton>
      ))}
    </div>
  );
};
