import { fmtPace } from "./dates";

/** Marathonafstand in km. */
export const MARATHON_KM = 42.195;
/** Streefdoel voor Berlijn, in minuten (4:00:00). Pas hier aan als je doel verandert. */
export const GOAL_MIN = 240;
/** Doeltempo in minuten per km (≈ 5:41 /km). */
export const GOAL_PACE = GOAL_MIN / MARATHON_KM;

export const goalTimeStr = () => {
  const h = Math.floor(GOAL_MIN / 60);
  const m = Math.round(GOAL_MIN % 60);
  return `${h}:${String(m).padStart(2, "0")}`;
};
export const goalPaceStr = () => fmtPace(GOAL_PACE);
