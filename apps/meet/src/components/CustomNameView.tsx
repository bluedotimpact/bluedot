import { useState } from 'react';
import { PageState } from '../lib/client/pageState';
import useJoinAs from '../lib/client/useJoinAs';
import { Page } from './Page';
import { H1 } from './Text';
import Button from './Button';

export type CustomNameViewProps = {
  page: PageState & { name: 'custom' },
  setPage: (page: PageState) => void,
};

const CustomNameView: React.FC<CustomNameViewProps> = ({ page: { cohortClassId }, setPage }) => {
  const [name, setName] = useState('');
  const { joinAs, isJoining, joinError } = useJoinAs({ cohortClassId, setPage });

  return (
    <Page>
      <div className="flex">
        <H1 className="flex-1">Hey there! Who are you?</H1>
      </div>
      {isJoining ? <p>Joining meeting...</p> : (
        <>
          <p>If you're sure this is the meeting for you, enter your name below</p>
          <form className="flex gap-2 mt-2" onSubmit={(event) => { event.preventDefault(); return joinAs({ name }); }}>
            <input type="text" autoComplete="name" placeholder="Your name" className="px-2 py-1.5 rounded border-2" value={name} onChange={(value) => setName(value.target.value)} />
            <Button onClick={() => joinAs({ name })}>Join</Button>
          </form>
        </>
      )}
      {joinError && <p>{joinError}</p>}
    </Page>
  );
};

export default CustomNameView;
