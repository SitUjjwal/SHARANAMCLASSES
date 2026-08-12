/**
 * Minimal SemVer (MAJOR.MINOR.PATCH) helpers — no external dependency.
 * Pre-release / build metadata is ignored for comparison (stripped after `-` / `+`).
 */

const CORE = /^v?(\d+)\.(\d+)\.(\d+)/i;

export type SemVerTriple = { major: number; minor: number; patch: number };

export function isValidSemver(input: string): boolean {
  return CORE.test(input.trim());
}

export function parseSemver(input: string): SemVerTriple | null {
  const m = CORE.exec(input.trim());
  if (!m) return null;
  return {
    major: Number(m[1]),
    minor: Number(m[2]),
    patch: Number(m[3]),
  };
}

/** Normalize to `major.minor.patch` or null. */
export function normalizeSemver(input: string): string | null {
  const p = parseSemver(input);
  if (!p) return null;
  return `${p.major}.${p.minor}.${p.patch}`;
}

/** -1 if a < b, 0 if equal, 1 if a > b. Invalid → treated as 0.0.0 */
export function compareSemver(a: string, b: string): number {
  const pa = parseSemver(a) ?? { major: 0, minor: 0, patch: 0 };
  const pb = parseSemver(b) ?? { major: 0, minor: 0, patch: 0 };
  if (pa.major !== pb.major) return pa.major < pb.major ? -1 : 1;
  if (pa.minor !== pb.minor) return pa.minor < pb.minor ? -1 : 1;
  if (pa.patch !== pb.patch) return pa.patch < pb.patch ? -1 : 1;
  return 0;
}

export function semverLt(a: string, b: string): boolean {
  return compareSemver(a, b) < 0;
}

export function semverGte(a: string, b: string): boolean {
  return compareSemver(a, b) >= 0;
}
