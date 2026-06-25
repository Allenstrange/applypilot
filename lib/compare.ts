// ============== RESUME COMPARISON ==============
// Pure, no-AI diffing utilities for comparing two resume profiles.

export interface SkillDiff {
  onlyA: string[];
  onlyB: string[];
  both: string[];
}

export function parseSkills(s: string): string[] {
  return Array.from(
    new Set(s.split(",").map((x) => x.trim()).filter(Boolean)),
  );
}

export function diffSkills(a: string, b: string): SkillDiff {
  const A = parseSkills(a);
  const B = parseSkills(b);
  const la = new Set(A.map((x) => x.toLowerCase()));
  const lb = new Set(B.map((x) => x.toLowerCase()));
  return {
    both: A.filter((x) => lb.has(x.toLowerCase())),
    onlyA: A.filter((x) => !lb.has(x.toLowerCase())),
    onlyB: B.filter((x) => !la.has(x.toLowerCase())),
  };
}

export type DiffToken = { text: string; type: "same" | "add" | "del" };

/** Word-level diff via longest-common-subsequence. del = only in A, add = only in B. */
export function diffWords(a: string, b: string): DiffToken[] {
  const aw = a.split(/(\s+)/);
  const bw = b.split(/(\s+)/);
  const n = aw.length;
  const m = bw.length;
  const dp: number[][] = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      dp[i][j] = aw[i] === bw[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }
  const out: DiffToken[] = [];
  let i = 0;
  let j = 0;
  while (i < n && j < m) {
    if (aw[i] === bw[j]) {
      out.push({ text: aw[i], type: "same" });
      i++; j++;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      out.push({ text: aw[i], type: "del" });
      i++;
    } else {
      out.push({ text: bw[j], type: "add" });
      j++;
    }
  }
  while (i < n) { out.push({ text: aw[i], type: "del" }); i++; }
  while (j < m) { out.push({ text: bw[j], type: "add" }); j++; }
  return out;
}
