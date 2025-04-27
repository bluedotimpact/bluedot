import { useState } from 'react';
import { useRouter } from 'next/router';
import {
  Box, Button, ErrorSection, LegacyText, Link, withAuth,
} from '@bluedot/ui';
import useAxios from 'axios-hooks';
import { Person, personTable } from '../lib/api/db/tables';

const AuthedPage = withAuth(({ auth, setAuth }) => {
  const [count, setCount] = useState(0);
  const router = useRouter();

  return (
    <div className="mx-8">
      <LegacyText.H1>Authed page</LegacyText.H1>
      <LegacyText.P>Here's the token we got: <code className="select-all">{auth.token}</code> (view on <Link url={`https://jwt.io/#debugger-io?token=${auth.token}`}>jwt.io</Link>)</LegacyText.P>
      <LegacyText.P>It expires at: {new Date(auth.expiresAt * 1000).toISOString()}</LegacyText.P>
      <Button onPress={() => setCount((c) => c + 1)}>
        count is {count}
      </Button>
      <LegacyText.H2>People</LegacyText.H2>
      <PeopleListView />
      <LegacyText.H2>Logout</LegacyText.H2>
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
    return <LegacyText.P>Loading...</LegacyText.P>;
  }

  if (error) {
    return <ErrorSection error={error} />;
  }

  return (
    <div className="grid md:grid-cols-4 gap-4">
      {data?.map((person) => (
        <Box key={person.id} className="px-4 py-2">
          <LegacyText.P>{person.firstName} {person.lastName} (<Link url={`https://airtable.com/${personTable.baseId}/${personTable.tableId}/${person.id}`}>view in Airtable</Link>)</LegacyText.P>
        </Box>
      ))}
    </div>
  );
});
