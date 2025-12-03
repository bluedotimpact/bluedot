import {
  TimeField, Label, DateInput, DateSegment,
} from 'react-aria-components';

export const TimePicker = () => {
  return (
    <TimeField>
      <Label>Event time</Label>
      <DateInput>
        {(segment) => <DateSegment segment={segment} />}
      </DateInput>
    </TimeField>
  );
};
