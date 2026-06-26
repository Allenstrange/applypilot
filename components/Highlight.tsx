import { Fragment, type ReactNode } from "react";
import { buildKeywordRegex } from "@/lib/keywords";

const BADGE_CLASS =
  "bg-amber-400/15 text-amber-700 dark:text-amber-300 font-semibold px-1.5 py-0.5 rounded border border-amber-500/25 inline-block";

/**
 * Renders `text` with every keyword highlighted.
 * - variant "badge" (default): amber pill, for dark output panels.
 * - variant "mark": <mark>, for the white CV document preview.
 */
export default function Highlight({
  text,
  keywords,
  variant = "badge",
}: {
  text: string;
  keywords: string[];
  variant?: "badge" | "mark";
}) {
  const regex = buildKeywordRegex(keywords);
  if (!regex || !text) return <>{text}</>;

  const nodes: ReactNode[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  let key = 0;
  while ((m = regex.exec(text)) !== null) {
    if (m.index > last)
      nodes.push(<Fragment key={key++}>{text.slice(last, m.index)}</Fragment>);
    nodes.push(
      variant === "mark" ? (
        <mark key={key++}>{m[0]}</mark>
      ) : (
        <span key={key++} className={BADGE_CLASS}>
          {m[0]}
        </span>
      ),
    );
    last = m.index + m[0].length;
    if (m.index === regex.lastIndex) regex.lastIndex++;
  }
  if (last < text.length)
    nodes.push(<Fragment key={key++}>{text.slice(last)}</Fragment>);
  return <>{nodes}</>;
}
