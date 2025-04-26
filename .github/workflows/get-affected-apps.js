#!/usr/bin/env node

const { exec } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const execAsync = (command) => new Promise((resolve, reject) => {
  exec(command, (error, stdout, stderr) => {
    if (error) {
      reject(error);
    } else {
      resolve(stdout.trim());
    }
  });
})

const getChangedFilesSinceLastSuccessfulCommit = async () => {
  // Get successful commits
  const repo = process.env.GITHUB_REPOSITORY ?? 'bluedotimpact/bluedot';
  const workflowName = process.env.GITHUB_WORKFLOW_NAME ?? 'ci_cd';
  const workflowId = await execAsync(`gh api repos/${repo}/actions/workflows --jq '.workflows[] | select(.name == "${workflowName}") | .id'`);

  const successfulCommitShas = (await execAsync(
    `gh api repos/${repo}/actions/workflows/${workflowId}/runs?status=success --jq '.workflow_runs[] | .head_sha'`
  )).split('\n');

  const successfulParentCommits = [...new Set(await getSuccessfulParentCommits('HEAD', successfulCommitShas))];
  console.error(`Successful parent commits:\n${successfulParentCommits.map(c => '- ' + c).join('\n')}`);

  // This intentionally uses `git log` instead of `git diff` so if a file is changed, then changed back, it will still be included
  // This is better for determining which apps need to be deployed, as it handles the case where
  // - a previous run is successful
  // - a change half-succeeds to deploy, but ultimately fails
  // - the change is reverted
  // (`git diff` would say nothing changed so we would not deploy the revert properly)
  // This is slightly worse for actions without side-effects like testing/linting/building, as in the above situation we'd run them even though we know they will succeed. We could use `git diff` here but I chose not to in order to avoid divergence between PR and master pipelines (which feels likely to introduce bugs/surprise), and because the above situation is rare.
  const changedFiles = [...new Set((await Promise.all(successfulParentCommits.map(async c => {
    return (await execAsync(`git log --name-only --pretty=format: ${c}..HEAD`)).split('\n').filter(Boolean);
  }))).flat())];

  return changedFiles;
}

/**
 * @param {string} commitSha 
 * @param {string[]} successfulCommitShas 
 * @param {number} maxDepth 
 * @returns {Promise<string[]>}
 */
const getSuccessfulParentCommits = async (commitSha, successfulCommitShas, maxDepth = 100) => {
  if (successfulCommitShas.includes(commitSha)) {
    return [commitSha];
  }
  
  const shas = (await execAsync(`git rev-list --parents -n 1 ${commitSha}`)).split(' ').filter(Boolean);
  const parents = shas.filter(sha => sha !== commitSha);
  return (await Promise.all(parents.map(parent => getSuccessfulParentCommits(parent, successfulCommitShas, maxDepth - 1)))).flat();
}

/**
 * @typedef {{
 *  name: string,
 *  location: string,
 *  scripts: { 'deploy:cd'?: string },
 *  dependencies?: { [key: string]: string },
 *  devDependencies?: { [key: string]: string }
 * }} NPMPackage
 * */

/**
 * @returns {Promise<{ name: string, isDeployableByCd: boolean, fileGlobs: string }[]>}
 */
const getInternalPackages = async () => {
  /** @type {NPMPackage[]} */
  const npmPackages = JSON.parse(await execAsync('npm query .workspace'));

  return npmPackages.map(package => {
    return {
      name: package.name,
      isDeployableByCd: !!package.scripts?.['deploy:cd'],
      fileGlobs: [
        'package-lock.json',
        `${package.location}/**`,
        ...[...new Set(findInternalDepsOfPackage(package, npmPackages))].map(dep => `${dep.location}/**`),
      ]
    }
  })
}

/**
 * @param {NPMPackage} package
 * @param {NPMPackage[]} internalNpmPackages
 * @returns {NPMPackage[]} dependenices of this package, that are from internalNpmPackages. May contain duplicate entries
 */
const findInternalDepsOfPackage = (package, internalNpmPackages) => {
  const allDeps = [...Object.keys(package.dependencies ?? {}), ...Object.keys(package.devDependencies ?? {})];
  const directInternalDeps = allDeps.filter(dep => internalNpmPackages.map(p => p.name).includes(dep))
  return directInternalDeps.map(dep => {
    const npmPackage = internalNpmPackages.find(p => p.name === dep);
    return [npmPackage, ...findInternalDepsOfPackage(npmPackage, internalNpmPackages)]
  }).flat();
}

const main = async () => {
  try {
    const [changedFiles, internalPackages] = await Promise.all([getChangedFilesSinceLastSuccessfulCommit(), getInternalPackages()]);
    console.error(`Changed files:\n${changedFiles.map(f => '- ' + f).join('\n')}`);
    
    const packagesWithChangedFiles = internalPackages.filter(p => {
      const filesChangedAffectingPackage = p.fileGlobs.map(glob => {
        const filesCovered = fs.globSync(glob);
        return [glob, filesCovered.filter(f => changedFiles.includes(f))];
      });

      const totalFilesChanged = filesChangedAffectingPackage.map(([glob, files]) => files.length).reduce((a, b) => a + b, 0);
      console.error(`${p.name}: ${totalFilesChanged} file(s) changed from globs:\n${filesChangedAffectingPackage.map(([glob, files]) => `- ${glob}${files.length > 0 ? '\n' : ''}${files.map(f => '  - ' + f).join('\n')}`).join('\n')}\n`);

      return totalFilesChanged > 0;
    });

    if (packagesWithChangedFiles.length === 0) {
      console.error('No packages changed, using Turborepo filter expression:');
      console.log('-- \'--filter=!*\'');
      return;
    }

    console.error(`Packages with changes: ${packagesWithChangedFiles.map(p => p.name).join(', ')}`);
    console.error('\nTurborepo filter expression:');
    console.log(`-- ${packagesWithChangedFiles.map(p => `--filter=${p.name}`).join(' ')}`);
  } catch (error) {
    console.error('Error:', error);
    console.error('\nDefaulting to building everything with Turborepo filter expression:');
    console.log('--');
    process.exit(1);
  }
}

void main();
