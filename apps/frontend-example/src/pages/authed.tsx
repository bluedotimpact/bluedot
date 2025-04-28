import { useState } from 'react';
import { CTALinkOrButton, NewText, withAuth } from '@bluedot/ui';
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
      <NewText.H1>Authed page</NewText.H1>
      <NewText.P>Here's the token we got: <code className="select-all">{auth.token}</code> (view on <NewText.A href={`https://jwt.io/#debugger-io?token=${auth.token}`}>jwt.io</NewText.A>)</NewText.P>
      <NewText.P>It expires at: {new Date(auth.expiresAt).toISOString()}</NewText.P>
      <CTALinkOrButton onClick={() => setCount((c) => c + 1)}>
        count is {count}
      </CTALinkOrButton>
      {/* <H2>Courses</H2>
      <CourseListView />
      <H2>Create course</H2>
      <CTALinkOrButton onClick={() => { mutate({ body: {}, headers: { authorization: '' } }); }}>Create</CTALinkOrButton> */}
      <NewText.H2>Logout</NewText.H2>
      <CTALinkOrButton onClick={() => {
        // This is a little jank: if we immediately setAuth to false the withAuth HOC will redirect us to login first
        router.push('/');
        setTimeout(() => setAuth(null), 1000);
      }}
      >
        Logout
      </CTALinkOrButton>
    </div>
  );
});
export default AuthedPage;
