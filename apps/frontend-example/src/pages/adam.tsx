import { useState } from 'react';
import {
  NewText, Input, Card, CTALinkOrButton,
} from '@bluedot/ui';
import useAxios from 'axios-hooks';
import { GetPeopleResponse } from './api/public/people';

// Airtable base and table IDs for direct links
const PERSON_TABLE_BASE_ID = 'appRcVrzrkGoSrfR4';
const PERSON_TABLE_ID = 'tblA0UsJCiOt9MN0k';

const HomePage = () => {
  const [value, setValue] = useState(0);
  const [incrementBy, setIncrementBy] = useState(1);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [{ data, loading, error }] = useAxios<GetPeopleResponse>({
    method: 'get',
    url: '/api/public/people',
  });

  return (
    <div className="section-body gap-4">
      <NewText.H1>Adam's page!</NewText.H1>
      <NewText.P>Increment by:</NewText.P>
      <Input type="number" value={incrementBy} onChange={(e) => setIncrementBy(e.target.valueAsNumber)} />

      <NewText.P>Value is {value}</NewText.P>
      <div className="flex gap-2">
        <CTALinkOrButton onClick={() => setValue((c) => c + incrementBy)}>+</CTALinkOrButton>
        <CTALinkOrButton onClick={() => setValue((c) => c - incrementBy)}>-</CTALinkOrButton>
      </div>

      <NewText.H2>People</NewText.H2>
      {loading
        ? <NewText.P className="animate-pulse">Loading...</NewText.P>
        : (
          <div className="grid grid-cols-2 gap-2">
            {data?.persons.map((person) => (
              <Card key={person.id} title={`${person.firstName} ${person.lastName}`} className="container-lined p-4">
                <NewText.P><NewText.A href={`https://airtable.com/${PERSON_TABLE_BASE_ID}/${PERSON_TABLE_ID}/${person.id}`}>View in Airtable</NewText.A></NewText.P>
              </Card>
            ))}
          </div>
        )}
    </div>
  );
};

export default HomePage;
