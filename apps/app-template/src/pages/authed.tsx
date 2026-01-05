import { useRouter } from 'next/router';
import {
  ErrorSection, H1, H2, P, A, withAuth, CTALinkOrButton, Card, ProgressDots,
} from '@bluedot/ui';
import useAxios from 'axios-hooks';
import { personTable } from '@bluedot/db';

// Airtable base and table IDs for direct links
const PERSON_TABLE_BASE_ID = 'appRcVrzrkGoSrfR4';
const PERSON_TABLE_ID = 'tblA0UsJCiOt9MN0k';

const AuthedPage = withAuth(({ auth, setAuth }) => {
  const router = useRouter();

  return (
    <div className="section-body gap-4">
      <H1>Authed page</H1>
      <P>Here's the token we got: <code className="select-all">{auth.token}</code> (view on <A href={`https://jwt.io/#debugger-io?token=${auth.token}`}>jwt.io</A>)</P>
      <P>It expires at: {new Date(auth.expiresAt).toISOString()}</P>
      <H2>People</H2>
      <PeopleListView />
      <H2>Logout</H2>
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

const PeopleListView: React.FC = withAuth(({ auth }) => {
  const [{ data, loading, error }] = useAxios<typeof personTable.pg.$inferSelect[]>({
    method: 'get',
    url: '/api/public/people',
    headers: {
      Authorization: `Bearer ${auth.token}`,
    },
  });

  if (loading) {
    return <ProgressDots />;
  }

  if (error) {
    return <ErrorSection error={error} />;
  }

  return (
    <div className="grid md:grid-cols-4 gap-4">
      {data?.map((person) => (
        <Card key={person.id} title={`${person.firstName} ${person.lastName}`} className="container-lined p-4">
          <P><A href={`https://airtable.com/${PERSON_TABLE_BASE_ID}/${PERSON_TABLE_ID}/${person.id}`}>View in Airtable</A></P>
        </Card>
      ))}
    </div>
  );
});
