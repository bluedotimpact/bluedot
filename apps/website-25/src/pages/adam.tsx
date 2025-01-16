import { useState } from 'react';
import {
  Box, Button, H1, H2, Input, Link, P,
} from '@bluedot/ui';
import useAxios from 'axios-hooks';
import { GetPeopleResponse } from './api/public/people';
import { personTable } from '../lib/api/db/tables';

const HomePage = () => {
  const [value, setValue] = useState(0);
  const [incrementBy, setIncrementBy] = useState(1);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [{ data, loading, error }] = useAxios<GetPeopleResponse>({
    method: 'get',
    url: '/api/public/people',
  });

  return (
    <div className="mx-8">
      <H1>Adam's page</H1>
      <P>Increment by:</P>
      <Input type="number" value={incrementBy} onChange={(e) => setIncrementBy(e.target.valueAsNumber)} />

      <P className="mt-8">Value is {value}</P>
      <Button onPress={() => setValue((c) => c + incrementBy)}>+</Button>
      <Button onPress={() => setValue((c) => c - incrementBy)} className="ml-2">-</Button>

      <H2>People</H2>
      {loading
        ? <P className="animate-pulse">Loading...</P>
        : (
          <div className="grid grid-cols-2 gap-2">
            {data?.persons.map((person) => (
              <Box className="px-4 py-2">
                <P>{person.firstName} {person.lastName} (<Link href={`https://airtable.com/${personTable.baseId}/${personTable.tableId}/${person.id}`}>view in Airtable</Link>)</P>
              </Box>
            ))}
          </div>
        )}
    </div>
  );
};

export default HomePage;
