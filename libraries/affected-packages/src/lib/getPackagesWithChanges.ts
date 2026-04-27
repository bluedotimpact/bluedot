/* eslint-disable no-console */
/* eslint-disable turbo/no-undeclared-env-vars */
import { matchesGlob } from 'node:path';
import { execAsync } from './execAsync';

const sleep = (ms: number): Promise<void> => new Promise((resolve) => {
  setTimeout(resolve, ms);
});

export const RETRY_BACKOFF_BASE_MS = 1000;
const MAX_API_ATTEMPTS = 3;

// GitHub's /actions/workflows/{id}/runs?status=success endpoint occasionally
// returns an empty page even when many successful runs exist. A single empty
// response here used to silently skip every deploy because the parent walk
// found no successful ancestor. Retry on empty, and throw if still empty after
// the final attempt so the failure is loud rather than silent.
const fetchSuccessfulCommitShas = async (repo: string, workflowId: string): Promise<string[]> => {
  for (let attempt = 1; attempt <= MAX_API_ATTEMPTS; attempt++) {
    // eslint-disable-next-line no-await-in-loop -- sequential retries are intentional
    const stdout = await execAsync(`gh api 'repos/${repo}/actions/workflows/${workflowId}/runs?status=success&per_page=100' --jq '.workflow_runs[] | .head_sha'`);
    const shas = stdout.split('\n').filter(Boolean);
    if (shas.length > 0) return shas;

    if (attempt < MAX_API_ATTEMPTS) {
      const backoffMs = 2 ** (attempt - 1) * RETRY_BACKOFF_BASE_MS;
      console.error(`GitHub API returned 0 successful ${workflowId} runs (attempt ${attempt}/${MAX_API_ATTEMPTS}). Retrying in ${backoffMs}ms...`);
      // eslint-disable-next-line no-await-in-loop -- sequential retries are intentional
      await sleep(backoffMs);
    }
  }

  throw new Error(`GitHub API returned 0 successful runs for workflow ${workflowId} after ${MAX_API_ATTEMPTS} attempts. This is almost certainly a transient API issue. Re-run the workflow to retry.`);
};

// `null` signals "could not determine which files changed" — caller should
// treat all packages as affected (conservative fallback). Used when the
// parent walk fails to find a successful ancestor, which usually means the
// fork point is older than `fetch-depth` in the calling workflow rather
// than a genuine API failure.
type ChangedFilesResult = string[] | null;

const getChangedFilesSinceLastSuccessfulCommit = async (): Promise<ChangedFilesResult> => {
  const repo = process.env.GITHUB_REPOSITORY ?? 'bluedotimpact/bluedot';
  const workflowName = process.env.GITHUB_WORKFLOW_NAME ?? 'ci_cd';
  const workflowId = await execAsync(`gh api repos/${repo}/actions/workflows --jq '.workflows[] | select(.name == "${workflowName}") | .id'`);

  const successfulCommitShas = await fetchSuccessfulCommitShas(repo, workflowId);

  const headSha = await execAsync('git rev-parse HEAD');
  const successfulParentCommits = [...new Set(await getSuccessfulParentCommits(headSha, successfulCommitShas))];
  console.error(`Successful parent commits:\n${successfulParentCommits.map((c) => `- ${c.commitSha}`).join('\n')}\n`);

  if (successfulParentCommits.length === 0) {
    console.error(`WARN: could not find any successful ${workflowName} run among ancestors of ${headSha}. Falling back to treating all packages as changed. (If this is a fresh PR with many commits since the fork point, increase fetch-depth in the calling workflow.)`);
    return null;
  }

  // This intentionally goes through all commits up to the parents with `git diff-tree`, instead of using `git diff` against the parent.
  // This is so if a file is changed, then changed back, it will still be included.
  // This is better for determining which apps need to be deployed, as it handles the case where:
  // - a previous run is successful
  // - a change half-succeeds to deploy, but ultimately fails
  // - the change is reverted
  // (`git diff` would say nothing changed so we would not deploy the revert properly)
  // This is slightly worse for actions without side-effects like testing/linting/building, as in the above situation we'd run them even though we know they will succeed. We could use `git diff` here but I chose not to in order to avoid divergence between PR and master pipelines (which feels likely to introduce bugs/surprise), and because the above situation is rare.
  const changedFiles = [...new Set((await Promise.all([
    ...successfulParentCommits.map((c) => c.path).flat()
      .map(async (pathSha) => (await execAsync(`git diff-tree --no-commit-id --name-only -r ${pathSha}`))
        .split('\n').filter(Boolean)),
    // get uncommited changes, including unstaged
    // eslint-disable-next-line @typescript-eslint/await-thenable -- the await resolves execAsync before the array is passed to Promise.all
    (await execAsync('git status --porcelain --untracked-files')).split('\n').map((f) => f.slice(3)).filter(Boolean),
  ])).flat())];

  return changedFiles;
};

/**
 * Get the successful parent commits of a given commit
 * @param commitSha The commit SHA to get parents for
 * @param successfulCommitShas Array of successful commit SHAs
 * @param maxDepth Maximum recursion depth
 * @returns Array of successful parent commit SHAs, with list of commits in git tree to them
 */
const getSuccessfulParentCommits = async (
  commitSha: string,
  successfulCommitShas: string[],
  maxDepth = 100,
): Promise<{ commitSha: string; path: string[] }[]> => {
  if (maxDepth <= 0) {
    return [];
  }

  if (successfulCommitShas.includes(commitSha)) {
    return [{ commitSha, path: [] }];
  }

  const parentShas = (await execAsync(`git rev-list --parents -n 1 ${commitSha}`)).split(' ').filter(Boolean);
  const parents = parentShas.filter((sha) => sha !== commitSha);
  return (await Promise.all(parents.map(async (parent) => {
    return (await getSuccessfulParentCommits(parent, successfulCommitShas, maxDepth - 1))
      .map((p) => ({ ...p, path: [commitSha, ...p.path] }));
  }))).flat();
};

type NPMPackage = {
  name: string;
  location: string;
  scripts: { 'deploy:cd'?: string };
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
};

type PackageInfo = {
  name: string;
  isDeployableByCd: boolean;
  fileGlobs: string[];
};

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

  if (changedFiles === null) {
    console.error('Treating all internal packages as changed (conservative fallback).\n');
    return internalPackages;
  }

  console.error(`Changed files:\n${changedFiles.map((f) => `- ${f}`).join('\n')}\n`);

  const packagesWithChanges = internalPackages.filter((p) => {
    const filesChangedAffectingPackage = p.fileGlobs.map((glob) => {
      return [glob, changedFiles.filter((f) => matchesGlob(f, glob))];
    });

    const totalFilesChanged = filesChangedAffectingPackage
      .map(([, files]) => (files as string[]).length)
      .reduce((a, b) => a + b, 0);

    /* eslint-disable @typescript-eslint/restrict-template-expressions -- glob is always a string from fileGlobs */
    console.error(`${p.name}: ${totalFilesChanged} file(s) changed from globs:\n${
      filesChangedAffectingPackage.map(([glob, files]) => `- ${glob}${(files as string[]).length > 0 ? '\n' : ''}${(files as string[]).map((f) => `  - ${f}`).join('\n')}`).join('\n')
    }\n`);
    /* eslint-enable @typescript-eslint/restrict-template-expressions */

    return totalFilesChanged > 0;
  });

  return packagesWithChanges;
};
