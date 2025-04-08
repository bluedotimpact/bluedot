import { useState } from 'react';
import { useRouter } from 'next/router';
import {
  asError, Box, Button, H1, H2, Link, P, withAuth,
} from '@bluedot/ui';
import useAxios from 'axios-hooks';
import { Person, personTable } from '../lib/api/db/tables';

const AuthedPage = withAuth(({ auth, setAuth }) => {
  const [count, setCount] = useState(0);
  const router = useRouter();

  return (
    <div className="mx-8">
      <H1>Authed page</H1>
      <P>Here's the token we got: <code className="select-all">{auth.token}</code> (view on <Link url={`https://jwt.io/#debugger-io?token=${auth.token}`}>jwt.io</Link>)</P>
      <P>It expires at: {new Date(auth.expiresAt * 1000).toISOString()}</P>
      <Button onPress={() => setCount((c) => c + 1)}>
        count is {count}
      </Button>
      <H2>People</H2>
      <PeopleListView />
      <H2>Logout</H2>
      <Button onPress={() => {
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

const PeopleListView: React.FC = withAuth(({ auth }) => {
  const [{ data, loading, error }] = useAxios<Person[]>({
    method: 'post',
    url: '/api/public/people',
    headers: {
      Authorization: `Bearer ${auth.token}`,
    },
  });

  if (loading) {
    return <P>Loading...</P>;
  }

  if (error) {
    return <P>Error: {asError(error).message}</P>;
  }

  return (
    <div className="grid md:grid-cols-4 gap-4">
      {data?.map((person) => (
        <Box key={person.id} className="px-4 py-2">
          <P>{person.firstName} {person.lastName} (<Link url={`https://airtable.com/${personTable.baseId}/${personTable.tableId}/${person.id}`}>view in Airtable</Link>)</P>
        </Box>
      ))}
    </div>
  );
});
