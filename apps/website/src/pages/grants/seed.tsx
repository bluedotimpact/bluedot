import DraftGrantPage from '../../components/grants/DraftGrantPage';

const SeedGrantsPage = () => (
  <DraftGrantPage
    title="Seed Grants"
    description="Early funding for promising new projects and organisations."
    path="/grants/seed"
    supportCopy="Early work that tests a promising approach to reducing risks from advanced AI or biological threats."
    audienceCopy="Founders and project leads with evidence of relevant ability and a concrete plan for an initial phase of work."
  />
);

SeedGrantsPage.pageRendersOwnNav = true;

export default SeedGrantsPage;
