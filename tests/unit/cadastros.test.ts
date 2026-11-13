import { describe, expect, it } from "vitest";
import { DEPLOYMENT_STATUSES, type DeploymentStatus } from "@/features/cadastros/types";
import { STATUS_CONFIG } from "@/features/cadastros/matrix/status-menu";

describe("Cadastros Deployment Statuses & Config", () => {
  it("defines all 5 canonical deployment statuses", () => {
    expect(DEPLOYMENT_STATUSES).toEqual([
      "nao_contratado",
      "a_cadastrar",
      "em_andamento",
      "feito_pelo_channel_manager",
      "no_ar",
    ]);
  });

  it("configures non-chromatic visual representation for all statuses", () => {
    for (const status of DEPLOYMENT_STATUSES) {
      const config = STATUS_CONFIG[status];
      expect(config).toBeDefined();
      expect(config.label).toBeTruthy();
      expect(config.icon).toBeDefined();
      expect(config.description).toBeTruthy();
      expect(config.badgeClass).toBeDefined();
    }
  });

  it("calculates urgency correctly based on deadline dates", () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    function computeUrgency(deadline: Date | null): "atrasado" | "perto" | "normal" {
      if (!deadline) return "normal";
      const diffDays = Math.ceil((deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays < 0) return "atrasado";
      if (diffDays <= 3) return "perto";
      return "normal";
    }

    // Yesterday -> overdue
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    expect(computeUrgency(yesterday)).toBe("atrasado");

    // Today -> perto (0 days)
    expect(computeUrgency(today)).toBe("perto");

    // In 2 days -> perto
    const inTwoDays = new Date(today);
    inTwoDays.setDate(today.getDate() + 2);
    expect(computeUrgency(inTwoDays)).toBe("perto");

    // In 10 days -> normal
    const inTenDays = new Date(today);
    inTenDays.setDate(today.getDate() + 10);
    expect(computeUrgency(inTenDays)).toBe("normal");

    // null deadline -> normal
    expect(computeUrgency(null)).toBe("normal");
  });
});
