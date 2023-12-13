import * as gcp from '@pulumi/gcp';
import { gcloudRegion } from '../config';

// Create the repository
export const repository = new gcp.artifactregistry.Repository('containers-repository', {
  location: gcloudRegion,
  format: 'docker',
  repositoryId: 'containers',
});
