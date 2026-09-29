import { expect, test } from 'vitest';
import { pickMoveTargets } from './moveTargets';

const round = (id: string, name: string) => ({ id, name });

test('keeps the soonest round of each variant, then fills to three soonest-first', () => {
  const rounds = [
    round('r1', 'AGI Strategy (2026 Oct W42) - Part-time'),
    round('r2', 'AGI Strategy (2026 Oct W42) - Intensive'),
    round('r3', 'AGI Strategy (2026 Nov W45) - Intensive'),
    round('r4', 'AGI Strategy (2026 Nov W47) - Part-time'),
    round('r5', 'AGI Strategy (2026 Nov W47) - Intensive'),
    round('r6', 'AGI Strategy (2026 Dec W50) - Intensive'),
  ];
  expect(pickMoveTargets(rounds).map((r) => r.id)).toEqual(['r1', 'r2', 'r3']);
});

test('a later part-time round stays reachable when intensives fill the near dates', () => {
  const rounds = [
    round('r1', 'AGI Strategy (2026 Oct W42) - Intensive'),
    round('r2', 'AGI Strategy (2026 Nov W45) - Intensive'),
    round('r3', 'AGI Strategy (2026 Nov W47) - Intensive'),
    round('r4', 'AGI Strategy (2026 Dec W50) - Part-time'),
  ];
  expect(pickMoveTargets(rounds).map((r) => r.id)).toEqual(['r1', 'r2', 'r4']);
});

test('returns everything in order when three or fewer rounds exist', () => {
  const rounds = [
    round('r1', 'AGI Strategy (2026 Oct W42) - Part-time'),
    round('r2', 'AGI Strategy (2026 Nov W45) - Intensive'),
  ];
  expect(pickMoveTargets(rounds).map((r) => r.id)).toEqual(['r1', 'r2']);
});

test('rounds without a variant suffix count as their own variant', () => {
  const rounds = [
    round('r1', 'AGI Strategy (2026 Oct W42) - Intensive'),
    round('r2', 'AGI Strategy (2026 Oct W42) - Part-time'),
    round('r3', 'AGI Strategy (2026 Nov W45)'),
    round('r4', 'AGI Strategy (2026 Nov W47) - Intensive'),
  ];
  expect(pickMoveTargets(rounds).map((r) => r.id)).toEqual(['r1', 'r2', 'r3']);
});
