/* eslint-disable no-console */
/* eslint-disable turbo/no-undeclared-env-vars */
import { matchesGlob } from 'node:path';
import { execAsync } from './execAsync';

const getChangedFilesSinceLastSuccessfulCommit = async (): Promise<string[]> => {
  const repo = process.env.GITHUB_REPOSITORY ?? 'bluedotimpact/bluedot';
  const workflowName = process.env.GITHUB_WORKFLOW_NAME ?? 'ci_cd';
  const workflowId = await execAsync(`gh api repos/${repo}/actions/workflows --jq '.workflows[] | select(.name == "${workflowName}") | .id'`);

  const successfulCommitShas = (await execAsync(
    `gh api repos/${repo}/actions/workflows/${workflowId}/runs?status=success --jq '.workflow_runs[] | .head_sha'`,
  )).split('\n');

  const headSha = await execAsync('git rev-parse HEAD');
  const successfulParentCommits = [...new Set(await getSuccessfulParentCommits(headSha, successfulCommitShas))];
  console.error(`Successful parent commits:\n${successfulParentCommits.map((c) => `- ${c}`).join('\n')}\n`);

  // This intentionally uses `git log` instead of `git diff` so if a file is changed, then changed back, it will still be included
  // This is better for determining which apps need to be deployed, as it handles the case where
  // - a previous run is successful
  // - a change half-succeeds to deploy, but ultimately fails
  // - the change is reverted
  // (`git diff` would say nothing changed so we would not deploy the revert properly)
  // This is slightly worse for actions without side-effects like testing/linting/building, as in the above situation we'd run them even though we know they will succeed. We could use `git diff` here but I chose not to in order to avoid divergence between PR and master pipelines (which feels likely to introduce bugs/surprise), and because the above situation is rare.
  const changedFiles = [...new Set((await Promise.all([
    ...successfulParentCommits.map(async (c) => (await execAsync(`git log --name-only --pretty=format: ${c}..${headSha}`)).split('\n').filter(Boolean)),
    // get uncommited changes, including unstaged
    (await execAsync('git status --porcelain --untracked-files')).split('\n').map((f) => f.slice(3)).filter(Boolean),
  ])).flat())];

  return changedFiles;
};

/**
 * Get the successful parent commits of a given commit
 * @param commitSha The commit SHA to get parents for
 * @param successfulCommitShas Array of successful commit SHAs
 * @param maxDepth Maximum recursion depth
 * @returns Array of successful parent commit SHAs
 */
const getSuccessfulParentCommits = async (
  commitSha: string,
  successfulCommitShas: string[],
  maxDepth = 100,
): Promise<string[]> => {
  if (maxDepth <= 0) {
    return [];
  }

  if (successfulCommitShas.includes(commitSha)) {
    return [commitSha];
  }

  const parentShas = (await execAsync(`git rev-list --parents -n 1 ${commitSha}`)).split(' ').filter(Boolean);
  const parents = parentShas.filter((sha) => sha !== commitSha);
  return (await Promise.all(parents.map((parent) => getSuccessfulParentCommits(parent, successfulCommitShas, maxDepth - 1)))).flat();
};

interface NPMPackage {
  name: string;
  location: string;
  scripts: { 'deploy:cd'?: string };
  dependencies?: { [key: string]: string };
  devDependencies?: { [key: string]: string };
}

interface PackageInfo {
  name: string;
  isDeployableByCd: boolean;
  fileGlobs: string[];
}

/**
 * @returns Array of package information for all packages in the monorepo
 */
const getInternalPackages = async (): Promise<PackageInfo[]> => {
  const npmPackages: NPMPackage[] = JSON.parse(await execAsync('npm query .workspace'));

  return npmPackages.map((pkg) => {
    return {
      name: pkg.name,
      isDeployableByCd: !!pkg.scripts?.['deploy:cd'],
      fileGlobs: [
        'package-lock.json',
        `${pkg.location}/**`,
        ...[...new Set(findInternalDepsOfPackage(pkg, npmPackages))].map((dep) => `${dep.location}/**`),
      ],
    };
  });
};

/**
 * Find all internal dependencies of a package
 * @param pkg The package to find dependencies for
 * @param internalNpmPackages Array of all internal packages
 * @returns Array of internal dependencies
 */
const findInternalDepsOfPackage = (
  pkg: NPMPackage,
  internalNpmPackages: NPMPackage[],
): NPMPackage[] => {
  const allDeps = [...Object.keys(pkg.dependencies ?? {}), ...Object.keys(pkg.devDependencies ?? {})];
  const directInternalDeps = allDeps.filter((dep) => internalNpmPackages.map((p) => p.name).includes(dep));

  return directInternalDeps.map((dep) => {
    const npmPackage = internalNpmPackages.find((p) => p.name === dep);
    if (!npmPackage) {
      return [];
    }
    return [npmPackage, ...findInternalDepsOfPackage(npmPackage, internalNpmPackages)];
  }).flat();
};

export const getPackagesWithChanges = async (): Promise<PackageInfo[]> => {
  const [changedFiles, internalPackages] = await Promise.all([
    getChangedFilesSinceLastSuccessfulCommit(),
    getInternalPackages(),
  ]);

  console.error(`Changed files:\n${changedFiles.map((f) => `- ${f}`).join('\n')}\n`);

  const packagesWithChanges = internalPackages.filter((p) => {
    const filesChangedAffectingPackage = p.fileGlobs.map((glob) => {
      return [glob, changedFiles.filter((f) => matchesGlob(f, glob))];
    });

    const totalFilesChanged = filesChangedAffectingPackage
      .map(([, files]) => (files as string[]).length)
      .reduce((a, b) => a + b, 0);

    console.error(`${p.name}: ${totalFilesChanged} file(s) changed from globs:\n${
      filesChangedAffectingPackage.map(([glob, files]) => `- ${glob}${(files as string[]).length > 0 ? '\n' : ''}${(files as string[]).map((f) => `  - ${f}`).join('\n')}`).join('\n')
    }\n`);

    return totalFilesChanged > 0;
  });

  return packagesWithChanges;
};
