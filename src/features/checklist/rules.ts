import { CHECKLIST_MODULES, type ChecklistData, type FieldMetaRecord } from "./types";

export function isFilled(v: unknown): boolean {
  if (v == null) return false;
  if (typeof v === "string") return v.trim() !== "";
  if (typeof v === "number") return true;
  if (typeof v === "boolean") return true;
  if (Array.isArray(v)) return v.length > 0;
  if (typeof v === "object") return Object.values(v as Record<string, unknown>).some(isFilled);
  return false;
}

export type ModuleProgress = {
  total: number;
  done: number;
  pend: number;
  conf: number;
  pct: number;
};

export type FullChecklistProgress = {
  total: number;
  done: number;
  pend: number;
  conf: number;
  pct: number;
  mods: Record<string, ModuleProgress>;
};

export function computeFullChecklistProgress(
  data: ChecklistData,
  fieldMeta: FieldMetaRecord = {}
): FullChecklistProgress {
  const res: FullChecklistProgress = {
    total: 0,
    done: 0,
    pend: 0,
    conf: 0,
    pct: 0,
    mods: {},
  };

  for (const mod of CHECKLIST_MODULES) {
    let t = 0;
    let dn = 0;
    let p = 0;
    let c = 0;

    for (const req of mod.requiredFields) {
      const fieldKey = req.key as string;
      const meta = fieldMeta[fieldKey];
      const st = meta?.status;
      const filled = isFilled((data as Record<string, unknown>)[fieldKey]);

      t++;
      if (st === "na") {
        dn++;
      } else if (st === "ok" || (filled && st !== "pend")) {
        dn++;
      }

      if (st === "pend" || (!filled && st !== "na" && st !== "ok" && st !== "conf")) {
        p++;
      }
      if (st === "conf") {
        c++;
      }
    }

    const modPct = t > 0 ? Math.round((dn / t) * 100) : 0;
    res.mods[mod.id] = { total: t, done: dn, pend: p, conf: c, pct: modPct };
    res.total += t;
    res.done += dn;
    res.pend += p;
    res.conf += c;
  }

  res.pct = res.total > 0 ? Math.round((res.done / res.total) * 100) : 0;
  return res;
}

export function computeChecklistProgress(
  data: ChecklistData,
  fieldMeta: FieldMetaRecord = {}
): number {
  return computeFullChecklistProgress(data, fieldMeta).pct;
}
