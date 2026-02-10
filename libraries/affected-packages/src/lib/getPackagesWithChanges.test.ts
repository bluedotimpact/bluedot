import {
  describe, test, expect, vi,
} from 'vitest';

import { getPackagesWithChanges } from './getPackagesWithChanges';
import { execAsync } from './execAsync';

const TEST_HEAD_COMMIT = 'f10960d0278ca14690b77080e6480ccbbb8e1f69';
const TEST_SUCCESSFUL_COMMIT = 'bc821876d613d0a95f76cee94c4b708fdb3e39f3';

vi.mock('./execAsync', async (importOriginal) => {
  const { execAsync: realExecAsync } = (await importOriginal());

  return {
    execAsync: vi.fn().mockImplementation(async (command) => {
      // Handle mocked commands
      const commandMocks: Record<string, string> = {
        'gh api repos/bluedotimpact/bluedot/actions/workflows --jq \'.workflows[] | select(.name == "ci_cd") | .id\'': '123',
        'gh api repos/bluedotimpact/bluedot/actions/workflows/123/runs?status=success --jq \'.workflow_runs[] | .head_sha\'': TEST_SUCCESSFUL_COMMIT,
        'git rev-parse HEAD': TEST_HEAD_COMMIT,
        'git status --porcelain --untracked-files': '?? libraries/affected-packages/src/lib/getPackagesWithChanges.test.ts',
      };
      if (commandMocks[command]) {
        return commandMocks[command];
      }

      // Let all other commands execute normally
      return realExecAsync(command);
    }),
  };
});

describe('getPackagesWithChanges', () => {
  test('should detect packages with changes', async (context) => {
    // Run if we have the commits in git history - skip on shallow clones e.g. in some CI environments
    const hasCommit = (sha: string) => execAsync(`git cat-file -e ${sha}^{commit}`).then(() => true).catch(() => false);
    const hasAllCommitsForTest = (await Promise.all([TEST_HEAD_COMMIT, TEST_SUCCESSFUL_COMMIT].map(hasCommit))).every(Boolean);
    if (!hasAllCommitsForTest) {
      context.skip();
      return;
    }

    const packageNames = (await getPackagesWithChanges()).map((p) => p.name);
    expect(packageNames).toContain('@bluedot/ui');
    expect(packageNames).toContain('@bluedot/website');
    expect(packageNames).not.toContain('@bluedot/infra');
  });

  test('should bubble up errors', async () => {
    // Override the exec mock to simulate an error from a command e.g. the GitHub API
    vi.mocked(execAsync).mockImplementationOnce(async () => {
      throw new Error('Command error');
    });

    await expect(getPackagesWithChanges()).rejects.toThrow();
  });
});
