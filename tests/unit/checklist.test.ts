import { describe, expect, it } from "vitest";
import { computeChecklistProgress, computeFullChecklistProgress } from "@/features/checklist/rules";
import { CHECKLIST_MODULES, type ChecklistData, type FieldMetaRecord } from "@/features/checklist/types";

describe("Checklist Progress Calculation", () => {
  it("returns 0 when no required fields are filled or marked ok", () => {
    const data: ChecklistData = {};
    const meta: FieldMetaRecord = {};
    const progress = computeChecklistProgress(data, meta);
    expect(progress).toBe(0);
  });

  it("calculates progress proportionally based on required fields", () => {
    const data: ChecklistData = {
      razaoSocial: "Hotel Exemplo Ltda",
      nomeFantasia: "Hotel Exemplo",
    };
    const meta: FieldMetaRecord = {};
    const progress = computeChecklistProgress(data, meta);
    expect(progress).toBeGreaterThan(0);
    expect(progress).toBeLessThan(100);
  });

  it("treats fields marked as 'na' as completed without blocking 100%", () => {
    const data: ChecklistData = {};
    const meta: FieldMetaRecord = {};

    // Mark all required fields as 'na' except one
    for (const mod of CHECKLIST_MODULES) {
      for (const req of mod.requiredFields) {
        meta[req.key as string] = { status: "na" };
      }
    }

    // Set one required field as 'ok'
    const firstReq = CHECKLIST_MODULES[0].requiredFields[0];
    meta[firstReq.key as string] = { status: "ok" };

    const progress = computeChecklistProgress(data, meta);
    expect(progress).toBe(100);
  });

  it("computes full progress per module reactively on keystroke changes", () => {
    const data: ChecklistData = {};
    const meta: FieldMetaRecord = {};

    const initial = computeFullChecklistProgress(data, meta);
    expect(initial.pct).toBe(0);
    expect(initial.pend).toBeGreaterThan(0);
    expect(initial.mods.identificacao.pct).toBe(0);

    // Typing into nomeFantasia immediately raises module 1 and general progress
    const updatedData: ChecklistData = {
      nomeFantasia: "Pousada Flor de Sal",
    };
    const afterType = computeFullChecklistProgress(updatedData, meta);
    expect(afterType.mods.identificacao.pct).toBeGreaterThan(0);
    expect(afterType.pct).toBeGreaterThan(0);
    expect(afterType.pend).toBeLessThan(initial.pend);
  });
});
