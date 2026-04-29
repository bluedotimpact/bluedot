import {
  describe, test, expect, vi, beforeEach,
} from 'vitest';

import { getPackagesWithChanges } from './getPackagesWithChanges';
import { execAsync } from './execAsync';

const TEST_HEAD_COMMIT = 'f10960d0278ca14690b77080e6480ccbbb8e1f69';
const TEST_SUCCESSFUL_COMMIT = 'bc821876d613d0a95f76cee94c4b708fdb3e39f3';
const SUCCESS_RUNS_COMMAND = 'gh api \'repos/bluedotimpact/bluedot/actions/workflows/123/runs?status=success&per_page=100\' --jq \'.workflow_runs[] | .head_sha\'';

vi.mock('./execAsync', async (importOriginal) => {
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion -- importOriginal() returns unknown, assertion is needed
  const { execAsync: realExecAsync } = (await importOriginal() as { execAsync: typeof execAsync });

  return {
    execAsync: vi.fn().mockImplementation(async (command) => {
      // Handle mocked commands
      const commandMocks: Record<string, string> = {
        'gh api repos/bluedotimpact/bluedot/actions/workflows --jq \'.workflows[] | select(.name == "ci_cd") | .id\'': '123',
        [SUCCESS_RUNS_COMMAND]: TEST_SUCCESSFUL_COMMIT,
        'git rev-parse HEAD': TEST_HEAD_COMMIT,
        'git status --porcelain --untracked-files': '?? libraries/affected-packages/src/lib/getPackagesWithChanges.test.ts',
      };
      if (commandMocks[command] !== undefined) {
        return commandMocks[command];
      }

      // Let all other commands execute normally
      return realExecAsync(command);
    }),
  };
});

beforeEach(() => {
  vi.useRealTimers();
  vi.mocked(execAsync).mockClear();
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

  test('throws when GitHub API returns 0 successful runs after all retries', async () => {
    // Override the success-runs query to consistently return empty
    const baseImpl = vi.mocked(execAsync).getMockImplementation()!;
    vi.mocked(execAsync).mockImplementation(async (command) => {
      if (command === SUCCESS_RUNS_COMMAND) return '';
      return baseImpl(command);
    });

    // Make sleep instant so the test doesn't take 7s
    vi.spyOn(globalThis, 'setTimeout').mockImplementation(((fn: () => void) => {
      fn();
      return 0 as unknown as ReturnType<typeof setTimeout>;
    }) as typeof setTimeout);

    await expect(getPackagesWithChanges()).rejects.toThrow(/0 successful runs.+after 3 attempts/);

    const successCalls = vi.mocked(execAsync).mock.calls.filter(([c]) => c === SUCCESS_RUNS_COMMAND);
    expect(successCalls).toHaveLength(3);
  });

  test('retries and succeeds when GitHub API recovers mid-attempt', async (context) => {
    const hasCommit = (sha: string) => execAsync(`git cat-file -e ${sha}^{commit}`).then(() => true).catch(() => false);
    const hasAllCommitsForTest = (await Promise.all([TEST_HEAD_COMMIT, TEST_SUCCESSFUL_COMMIT].map(hasCommit))).every(Boolean);
    if (!hasAllCommitsForTest) {
      context.skip();
      return;
    }

    const baseImpl = vi.mocked(execAsync).getMockImplementation()!;
    let callCount = 0;
    vi.mocked(execAsync).mockImplementation(async (command) => {
      if (command === SUCCESS_RUNS_COMMAND) {
        callCount += 1;
        if (callCount < 2) return ''; // first attempt empty, second succeeds

        return TEST_SUCCESSFUL_COMMIT;
      }

      return baseImpl(command);
    });

    vi.spyOn(globalThis, 'setTimeout').mockImplementation(((fn: () => void) => {
      fn();
      return 0 as unknown as ReturnType<typeof setTimeout>;
    }) as typeof setTimeout);

    await expect(getPackagesWithChanges()).resolves.toBeInstanceOf(Array);
    expect(callCount).toBe(2);
  });

  test('falls back to all packages when no successful ancestor is reachable', async () => {
    // Return a SHA that's not an ancestor, and mock `git rev-list` so the
    // parent walk runs without depending on real git history (CI uses a
    // shallow clone where TEST_HEAD_COMMIT is not present).
    const baseImpl = vi.mocked(execAsync).getMockImplementation()!;
    vi.mocked(execAsync).mockImplementation(async (command) => {
      if (command === SUCCESS_RUNS_COMMAND) return '0000000000000000000000000000000000000000';
      // Any rev-list --parents call returns the queried SHA itself — parent walk
      // returns [] immediately. Broad match avoids a real git call (which hangs
      // on CI for unknown SHAs) when the walk visits the all-zeros SHA.
      const revListMatch = command.match(/^git rev-list --parents -n 1 ([0-9a-f]+)$/);
      if (revListMatch?.[1]) return revListMatch[1];
      return baseImpl(command);
    });

    const result = await getPackagesWithChanges();
    // Sanity: returns the full set, not a filtered subset.
    expect(result.length).toBeGreaterThan(1);
    expect(result.map((p) => p.name)).toContain('@bluedot/website');
    expect(result.map((p) => p.name)).toContain('@bluedot/infra');
  });
});
