/**
 * Largest-remainder method (Hamilton-Hare) for integer proportional allocation.
 * Guarantees that sum(allocated) === totalToAllocate exactly, with zero minor unit drift.
 */
export function allocateLargestRemainder(
  totalToAllocate: number,
  bases: number[]
): number[] {
  if (totalToAllocate <= 0 || bases.length === 0) {
    return bases.map(() => 0);
  }

  const totalBase = bases.reduce((sum, b) => sum + Math.max(0, b), 0);
  if (totalBase <= 0) {
    return bases.map(() => 0);
  }

  // Cap allocation to total base (cannot discount more than available)
  const target = Math.min(totalToAllocate, totalBase);

  const exactShares = bases.map((base) => {
    const validBase = Math.max(0, base);
    return (target * validBase) / totalBase;
  });

  const floored = exactShares.map((share) => Math.floor(share));
  const floorSum = floored.reduce((sum, f) => sum + f, 0);
  let remainderCount = target - floorSum;

  const withRemainders = exactShares.map((share, idx) => ({
    idx,
    remainder: share - floored[idx],
  }));

  // Sort descending by remainder, with original index as stable tie-breaker
  withRemainders.sort((a, b) => {
    if (b.remainder !== a.remainder) {
      return b.remainder - a.remainder;
    }
    return a.idx - b.idx;
  });

  const result = [...floored];
  for (let i = 0; i < remainderCount; i++) {
    const targetIdx = withRemainders[i % withRemainders.length].idx;
    result[targetIdx] += 1;
  }

  return result;
}

/**
 * Standard half-up tax rounding:
 * tax = round(taxable * rateBps / 10000)
 */
export function calculateTaxAmount(taxableAmount: number, rateBps: number): number {
  if (taxableAmount <= 0 || rateBps <= 0) {
    return 0;
  }
  return Math.round((taxableAmount * rateBps) / 10000);
}

