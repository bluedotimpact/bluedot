import { useRouter } from 'next/router';
import {
  ErrorSection, NewText, withAuth, CTALinkOrButton, Card,
} from '@bluedot/ui';
import useAxios from 'axios-hooks';
import { Person, personTable } from '../lib/api/db/tables';

const AuthedPage = withAuth(({ auth, setAuth }) => {
  const router = useRouter();

  return (
    <div className="section-body gap-4">
      <NewText.H1>Authed page</NewText.H1>
      <NewText.P>Here's the token we got: <code className="select-all">{auth.token}</code> (view on <NewText.A href={`https://jwt.io/#debugger-io?token=${auth.token}`}>jwt.io</NewText.A>)</NewText.P>
      <NewText.P>It expires at: {new Date(auth.expiresAt * 1000).toISOString()}</NewText.P>
      <NewText.H2>People</NewText.H2>
      <PeopleListView />
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

const PeopleListView: React.FC = withAuth(({ auth }) => {
  const [{ data, loading, error }] = useAxios<Person[]>({
    method: 'post',
    url: '/api/public/people',
    headers: {
      Authorization: `Bearer ${auth.token}`,
    },
  });

  if (loading) {
    return <NewText.P>Loading...</NewText.P>;
  }

  if (error) {
    return <ErrorSection error={error} />;
  }

  return (
    <div className="grid md:grid-cols-4 gap-4">
      {data?.map((person) => (
        <Card key={person.id} title={`${person.firstName} ${person.lastName}`} className="container-lined p-4">
          <NewText.P><NewText.A href={`https://airtable.com/${personTable.baseId}/${personTable.tableId}/${person.id}`}>View in Airtable</NewText.A></NewText.P>
        </Card>
      ))}
    </div>
  );
});
