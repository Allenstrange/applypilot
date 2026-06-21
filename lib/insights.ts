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

export interface ResponseStats {
  avgResponseDays: number;
  appliedToInterviewDays: number;
  interviewToOfferDays: number;
  sampleSize: number;
}

export interface CVPerf {
  label: string;
  applied: number;
  interview: number;
  offer: number;
  interviewRate: number;
}

export interface Funnel {
  total: number;
  rejected: number;
  active: number;
  reached: Record<"planned" | "applied" | "interview" | "offer", number>;
  conv: { appliedToInterview: number; interviewToOffer: number; offerRate: number };
  byStatus: Record<ApplicationStatus, number>;
  thisWeek: number;
  response: ResponseStats;
  cvPerf: CVPerf[];
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
    response: computeResponse(apps),
    cvPerf: computeCVPerf(apps),
  };
}

const DAY = 24 * 60 * 60 * 1000;

/** Timestamp (ms) the first time an application reached a given status, else null. */
function reachedAt(app: Application, status: ApplicationStatus): number | null {
  const hist = app.statusHistory ?? [{ status: app.status, at: app.createdAt }];
  const ev = hist.find((h) => h.status === status);
  return ev ? new Date(ev.at).getTime() : null;
}

function avgDays(nums: number[]): number {
  if (!nums.length) return 0;
  return Math.round((nums.reduce((a, b) => a + b, 0) / nums.length) * 10) / 10;
}

/** Average days between stages, derived from each application's status history. */
function computeResponse(apps: Application[]): ResponseStats {
  const resp: number[] = [];
  const ai: number[] = [];
  const io: number[] = [];
  apps.forEach((a) => {
    const applied = reachedAt(a, "applied");
    const interview = reachedAt(a, "interview");
    const offer = reachedAt(a, "offer");
    const rejected = reachedAt(a, "rejected");
    if (applied != null) {
      const responses = [interview, offer, rejected].filter(
        (x): x is number => x != null && x >= applied,
      );
      if (responses.length) resp.push((Math.min(...responses) - applied) / DAY);
    }
    if (applied != null && interview != null && interview >= applied)
      ai.push((interview - applied) / DAY);
    if (interview != null && offer != null && offer >= interview)
      io.push((offer - interview) / DAY);
  });
  return {
    avgResponseDays: avgDays(resp),
    appliedToInterviewDays: avgDays(ai),
    interviewToOfferDays: avgDays(io),
    sampleSize: resp.length,
  };
}

/** Group applications by their CV angle (target role) and rank by interview rate. */
function computeCVPerf(apps: Application[]): CVPerf[] {
  const groups = new Map<string, Application[]>();
  apps.forEach((a) => {
    const label = (a.snapshot?.draftCV?.title || a.title || "Untitled").trim();
    const arr = groups.get(label) ?? [];
    arr.push(a);
    groups.set(label, arr);
  });
  const out: CVPerf[] = [];
  groups.forEach((arr, label) => {
    const applied = arr.filter((a) => maxStageReached(a) >= 1).length;
    if (applied === 0) return;
    const interview = arr.filter((a) => maxStageReached(a) >= 2).length;
    const offer = arr.filter((a) => maxStageReached(a) >= 3).length;
    out.push({ label, applied, interview, offer, interviewRate: pct(interview, applied) });
  });
  return out.sort((a, b) => b.interviewRate - a.interviewRate || b.offer - a.offer);
}
