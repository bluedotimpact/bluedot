import {
  describe, test, expect, vi,
  MockInstance,
} from 'vitest';

import * as childProcess from 'node:child_process';
import { getPackagesWithChanges } from './getPackagesWithChanges';
import { execAsync } from './execAsync';

const TEST_HEAD_COMMIT = 'f10960d0278ca14690b77080e6480ccbbb8e1f69';
const TEST_SUCCESSFUL_COMMIT = 'bc821876d613d0a95f76cee94c4b708fdb3e39f3';

// Mock the child_process module
vi.mock('node:child_process', async (importOriginal) => {
  const realChildProcess: typeof childProcess = await importOriginal();

  return {
    ...realChildProcess,
    exec: vi.fn().mockImplementation((command, options, callback) => {
      // Normalize arguments to handle both function signatures
      const cb = typeof options === 'function' ? options : callback;

      // Check if this command should be mocked
      const commandMocks: Record<string, string> = {
        'gh api repos/bluedotimpact/bluedot/actions/workflows --jq \'.workflows[] | select(.name == "ci_cd") | .id\'': '123',
        'gh api repos/bluedotimpact/bluedot/actions/workflows/123/runs?status=success': TEST_SUCCESSFUL_COMMIT,
        'git rev-parse HEAD': TEST_HEAD_COMMIT,
        'git status --porcelain --untracked-files': '?? libraries/affected-packages/src/lib/getPackagesWithChanges.test.ts',
      };
      const mockKey = Object.keys(commandMocks).find((key) => command.includes(key));

      if (mockKey && cb) {
        // Return the mock result
        setTimeout(() => {
          cb(null, commandMocks[mockKey]!, '');
        }, 0);

        return {} as childProcess.ChildProcess;
      }

      // Let all other commands execute normally
      return realChildProcess.exec(command, options, callback);
    }),
  };
});

describe('getPackagesWithChanges', async () => {
  // run if we have the git history to - skip on shallow clones e.g. in some CI environments
  const hasTestCommits = (await Promise.allSettled([TEST_HEAD_COMMIT, TEST_SUCCESSFUL_COMMIT].map((commit) => execAsync(`git cat-file -e ${commit}^{commit}`)))).every((p) => p.status === 'fulfilled');
  test.runIf(hasTestCommits)('should detect packages with changes', async () => {
    const packageNames = (await getPackagesWithChanges()).map((p) => p.name);
    expect(packageNames).toContain('@bluedot/ui');
    expect(packageNames).toContain('@bluedot/website');
    expect(packageNames).not.toContain('@bluedot/infra');
  });

  test('should bubble up errors', async () => {
    // Override the exec mock to simulate an error for GitHub API
    (childProcess.exec as unknown as MockInstance).mockImplementationOnce((command, options, callback) => {
      // Normalize arguments to handle both function signatures
      const cb = typeof options === 'function' ? options : callback;

      if (command.includes('gh api repos/') && cb) {
        setTimeout(() => {
          cb(new Error('GitHub API error'), '', '');
        }, 0);
        return {} as childProcess.ChildProcess;
      }

      // Let all other commands execute normally
      return childProcess.exec(command, typeof options === 'function' ? undefined : options, cb);
    });

    // Call the function and expect it to throw
    await expect(getPackagesWithChanges()).rejects.toThrow();
  });
});
