"use client";

import { motion } from "motion/react";

/** High-visibility keyword tracker shown at the top of an output panel. */
export default function KeywordBadges({ keywords }: { keywords: string[] }) {
  if (!keywords?.length) return null;
  return (
    <div className="flex flex-wrap gap-1.5 mb-4">
      {keywords.map((k, i) => (
        <motion.span
          key={k + i}
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: i * 0.03 }}
          className="bg-amber-400/15 text-amber-700 dark:text-amber-300 font-semibold text-xs px-2 py-0.5 rounded-full border border-amber-500/25"
        >
          {k}
        </motion.span>
      ))}
    </div>
  );
}
