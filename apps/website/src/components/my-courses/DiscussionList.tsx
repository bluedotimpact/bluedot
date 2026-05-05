import DiscussionListRow from './DiscussionListRow';

const DiscussionList = () => (
  <ul className="divide-y divide-bluedot-navy/10">
    <DiscussionListRow date="Apr 29" time="4:00 PM" unit="UNIT 1" title="The technical challenge with AI" status="attended" />
    <DiscussionListRow date="Apr 29" time="4:00 PM" unit="UNIT 2" title="Training safer models" status="absent" />
    <DiscussionListRow date="Apr 29" time="4:00 PM" unit="UNIT 3" title="Detecting danger" status="upcoming" />
  </ul>
);

export default DiscussionList;
