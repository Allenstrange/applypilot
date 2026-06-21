// ============== APPLICATION INSIGHTS ==============
// Pure analytics over the tracked applications — no AI. Powers the funnel
// dashboard (conversion from planned → applied → interview → offer).

import type { Application, ApplicationStatus } from "./types";

export const STAGE_ORDER: ApplicationStatus[] = ["planned", "applied", "interview", "offer"];
const stageIndex = (s: ApplicationStatus) => STAGE_ORDER.indexOf(s);

/** Highest progression stage an application has ever reached (ignores rejected). */
export function maxStageReached(app: Application): number {
  const seen = [app.status, ...(app.statusHistory?.map((h) => h.status) ?? [])];
  return seen.reduce((m, s) => Math.max(m, stageIndex(s)), -1);
}

export interface Funnel {
  total: number;
  rejected: number;
  active: number;
  reached: Record<"planned" | "applied" | "interview" | "offer", number>;
  conv: { appliedToInterview: number; interviewToOffer: number; offerRate: number };
  byStatus: Record<ApplicationStatus, number>;
  thisWeek: number;
}

const pct = (num: number, den: number) => (den > 0 ? Math.round((num / den) * 100) : 0);

export function computeFunnel(apps: Application[], now = Date.now()): Funnel {
  const byStatus: Record<ApplicationStatus, number> = {
    planned: 0, applied: 0, interview: 0, offer: 0, rejected: 0,
  };
  apps.forEach((a) => { byStatus[a.status] += 1; });

  const reachedCount = (i: number) => apps.filter((a) => maxStageReached(a) >= i).length;
  const reached = {
    planned: reachedCount(0),
    applied: reachedCount(1),
    interview: reachedCount(2),
    offer: reachedCount(3),
  };

  const weekAgo = now - 7 * 24 * 60 * 60 * 1000;
  const thisWeek = apps.filter((a) => new Date(a.createdAt).getTime() > weekAgo).length;

  return {
    total: apps.length,
    rejected: byStatus.rejected,
    active: apps.length - byStatus.rejected,
    reached,
    conv: {
      appliedToInterview: pct(reached.interview, reached.applied),
      interviewToOffer: pct(reached.offer, reached.interview),
      offerRate: pct(reached.offer, apps.length),
    },
    byStatus,
    thisWeek,
  };
}
