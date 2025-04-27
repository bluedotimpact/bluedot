import { useState } from 'react';
import {
  Box, Button, LegacyText, Input, Link,
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
      <LegacyText.H1>Adam's page!</LegacyText.H1>
      <LegacyText.P>Increment by:</LegacyText.P>
      <Input type="number" value={incrementBy} onChange={(e) => setIncrementBy(e.target.valueAsNumber)} />

      <LegacyText.P className="mt-8">Value is {value}</LegacyText.P>
      <Button onPress={() => setValue((c) => c + incrementBy)}>+</Button>
      <Button onPress={() => setValue((c) => c - incrementBy)} className="ml-2">-</Button>

      <LegacyText.H2>People</LegacyText.H2>
      {loading
        ? <LegacyText.P className="animate-pulse">Loading...</LegacyText.P>
        : (
          <div className="grid grid-cols-2 gap-2">
            {data?.persons.map((person) => (
              <Box className="px-4 py-2">
                <LegacyText.P>{person.firstName} {person.lastName} (<Link url={`https://airtable.com/${personTable.baseId}/${personTable.tableId}/${person.id}`}>view in Airtable</Link>)</LegacyText.P>
              </Box>
            ))}
          </div>
        )}
    </div>
  );
};

export default HomePage;
