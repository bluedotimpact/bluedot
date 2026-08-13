import DraftGrantPage from '../../components/grants/DraftGrantPage';

const MediaGrantsPage = () => (
  <DraftGrantPage
    title="Media Grants"
    description="Funding for media that helps more people understand AI safety and biosecurity."
    path="/grants/media"
    supportCopy="Independent media projects that make important ideas clearer and reach audiences who would not otherwise encounter them."
    audienceCopy="Creators with a clear audience, a strong idea, and a credible plan to publish useful work."
  />
);

MediaGrantsPage.pageRendersOwnNav = true;

export default MediaGrantsPage;
