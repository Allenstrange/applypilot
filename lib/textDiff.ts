// ============== WORD-LEVEL TEXT DIFF (no deps) ==============
// Classic LCS over word tokens, used to render Rezi-style red-strikethrough /
// green-addition previews for proposed edits. Inputs are résumé-sized strings
// (a bullet, a summary), so the O(n·m) table is trivially cheap.

export type DiffOp = "same" | "del" | "add";

export interface DiffSegment {
  type: DiffOp;
  text: string;
}

function tokenize(s: string): string[] {
  // Split on whitespace but keep it attached to the preceding word so joins
  // reconstruct the original spacing closely enough for display.
  return (s || "").split(/(\s+)/).filter((t) => t.length > 0);
}

/** Merge consecutive segments of the same type into one. */
function compact(segs: DiffSegment[]): DiffSegment[] {
  const out: DiffSegment[] = [];
  for (const s of segs) {
    const last = out[out.length - 1];
    if (last && last.type === s.type) last.text += s.text;
    else out.push({ ...s });
  }
  return out;
}

/**
 * Word-level diff from `before` to `after`. Whitespace tokens are folded into
 * their neighbouring ops, so the output is a small list of styled runs.
 */
export function diffWords(before: string, after: string): DiffSegment[] {
  const a = tokenize(before);
  const b = tokenize(after);
  if (a.length === 0) return b.length ? [{ type: "add", text: b.join("") }] : [];
  if (b.length === 0) return [{ type: "del", text: a.join("") }];

  // LCS length table
  const n = a.length;
  const m = b.length;
  const dp: number[][] = Array.from({ length: n + 1 }, () => new Array<number>(m + 1).fill(0));
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      dp[i][j] = a[i] === b[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }

  // Walk the table emitting ops.
  const segs: DiffSegment[] = [];
  let i = 0;
  let j = 0;
  while (i < n && j < m) {
    if (a[i] === b[j]) {
      segs.push({ type: "same", text: a[i] });
      i++;
      j++;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      segs.push({ type: "del", text: a[i] });
      i++;
    } else {
      segs.push({ type: "add", text: b[j] });
      j++;
    }
  }
  while (i < n) segs.push({ type: "del", text: a[i++] });
  while (j < m) segs.push({ type: "add", text: b[j++] });

  return compact(segs);
}
