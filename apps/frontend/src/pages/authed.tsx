import { useState } from 'react';
import {
  Button, CardButton, H1, H2, P,
} from '@bluedot/ui';
import { useQueryClient } from '@tanstack/react-query';
import { withAuth } from '../lib/withAuth';
import { client } from '../lib/queryClient';

const AuthedPage = withAuth(({ setAuth }) => {
  const [count, setCount] = useState(0);
  const queryClient = useQueryClient();
  const { mutate } = client.createCourse.useMutation({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
    },
  });

  return (
    <div className="mx-8">
      <H1>Authed page</H1>
      <P>This is some example text</P>
      <Button onPress={() => setCount((c) => c + 1)}>
        count is {count}
      </Button>
      <H2>Courses</H2>
      <CourseListView />
      <H2>Create course</H2>
      <Button onPress={() => { mutate({ body: {}, headers: { authorization: '' } }); }}>Create</Button>
      <H2>Logout</H2>
      <Button onPress={() => setAuth(null)}>Logout</Button>
    </div>
  );
});
export default AuthedPage;

const CourseListView: React.FC = () => {
  const { data, isLoading, error } = client.listCourses.useQuery(['courses'], { headers: { authorization: '' } });

  if (isLoading) {
    return <P>Loading...</P>;
  }

  if (error) {
    return <P>Error: {JSON.stringify(error.body)}</P>;
  }

  return (
    <div className="grid md:grid-cols-4 gap-4">
      {data.body.map((course) => (
        <CardButton key={course.courseId} onPress={() => alert('test')}>
          <H2>{course.name}</H2>
        </CardButton>
      ))}
    </div>
  );
};
