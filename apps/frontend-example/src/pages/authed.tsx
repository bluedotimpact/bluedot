import { useState } from 'react';
import {
  Button, H1, H2, P, A, withAuth,
} from '@bluedot/ui';
import { useRouter } from 'next/router';

const AuthedPage = withAuth(({ auth, setAuth }) => {
  const router = useRouter();
  const [count, setCount] = useState(0);
  // const queryClient = useQueryClient();
  // const { mutate } = client.createCourse.useMutation({
  //   onSuccess: () => {
  //     queryClient.invalidateQueries({ queryKey: ['courses'] });
  //   },
  // });

  return (
    <div className="section-body gap-4">
      <H1>Authed page</H1>
      <P>Here's the token we got: <code className="select-all">{auth.token}</code> (view on <A href={`https://jwt.io/#debugger-io?token=${auth.token}`}>jwt.io</A>)</P>
      <P>It expires at: {new Date(auth.expiresAt).toISOString()}</P>
      <Button onClick={() => setCount((c) => c + 1)}>
        count is {count}
      </Button>
      {/* <H2>Courses</H2>
      <CourseListView />
      <H2>Create course</H2>
      <Button onClick={() => { mutate({ body: {}, headers: { authorization: '' } }); }}>Create</Button> */}
      <H2>Logout</H2>
      <Button onClick={() => {
        // This is a little jank: if we immediately setAuth to false the withAuth HOC will redirect us to login first
        router.push('/');
        setTimeout(() => setAuth(null), 1000);
      }}
      >
        Logout
      </Button>
    </div>
  );
});
export default AuthedPage;
