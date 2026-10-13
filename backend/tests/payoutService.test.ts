import { calculatePayout, capPayout } from "../src/services/payoutService";
import { detectViewSpike } from "../src/controllers/submissionController";

describe("Payout Service & Milestone Logic", () => {
  const memeMilestones = [
    { views: 10000, payout: 500 },
    { views: 50000, payout: 2000 },
    { views: 100000, payout: 5000 },
  ];

  describe("calculatePayout", () => {
    test("returns 0 when views are below the first milestone threshold", () => {
      expect(calculatePayout(0, memeMilestones)).toBe(0);
      expect(calculatePayout(9999, memeMilestones)).toBe(0);
    });

    test("returns the exact payout when a milestone threshold is crossed", () => {
      expect(calculatePayout(10000, memeMilestones)).toBe(500);
      expect(calculatePayout(50000, memeMilestones)).toBe(2000);
      expect(calculatePayout(100000, memeMilestones)).toBe(5000);
    });

    test("returns highest milestone payout when views are between tiers", () => {
      expect(calculatePayout(25000, memeMilestones)).toBe(500);
      expect(calculatePayout(75000, memeMilestones)).toBe(2000);
      expect(calculatePayout(500000, memeMilestones)).toBe(5000);
    });

    test("correctly handles skipping multiple milestones in a single view jump", () => {
      // 0 views jumps straight to 120,000 views in one step
      const initialPayout = calculatePayout(0, memeMilestones);
      const jumpedPayout = calculatePayout(120000, memeMilestones);

      expect(initialPayout).toBe(0);
      expect(jumpedPayout).toBe(5000);
      const payoutDifference = jumpedPayout - initialPayout;
      expect(payoutDifference).toBe(5000);
    });

    test("handles unsorted milestone array by ordering views ascending", () => {
      const unsorted = [
        { views: 100000, payout: 5000 },
        { views: 10000, payout: 500 },
        { views: 50000, payout: 2000 },
      ];
      expect(calculatePayout(60000, unsorted)).toBe(2000);
    });

    test("throws an error when views are negative or invalid", () => {
      expect(() => calculatePayout(-50, memeMilestones)).toThrow(
        "Views must be a non-negative number"
      );
      expect(() => calculatePayout(NaN, memeMilestones)).toThrow();
    });
  });

  describe("capPayout & Budget Guardrails", () => {
    test("allows full payout when remaining budget exceeds payout", () => {
      expect(capPayout(2000, 10000)).toBe(2000);
    });

    test("caps payout at exact remaining budget when budget is partially exhausted", () => {
      // Creator earns 5000, but campaign only has 1500 left
      expect(capPayout(5000, 1500)).toBe(1500);
    });

    test("returns 0 when remaining budget is 0", () => {
      expect(capPayout(5000, 0)).toBe(0);
    });

    test("throws an error if payout or remaining budget are negative", () => {
      expect(() => capPayout(-100, 5000)).toThrow();
      expect(() => capPayout(500, -10)).toThrow();
    });
  });

  describe("Idempotency & View Drop Scenarios", () => {
    test("repeated updates with identical views result in 0 additional payout (no double-pay)", () => {
      const currentPayout = 2000;
      const desiredPayout = calculatePayout(50000, memeMilestones); // 2000
      const additionalPayout = Math.max(0, desiredPayout - currentPayout);

      expect(additionalPayout).toBe(0);
    });

    test("view drops result in 0 additional payout without clawing back earnings", () => {
      // Creator earned 5000 at 100k views, platform adjusts views down to 30k
      const currentPayout = 5000;
      const adjustedDesired = calculatePayout(30000, memeMilestones); // 500
      const payoutDifference = adjustedDesired - currentPayout; // -4500

      // In accordance with marketplace rules, payoutDifference < 0 means no change
      const additionalDisbursement = payoutDifference > 0 ? payoutDifference : 0;
      expect(additionalDisbursement).toBe(0);
    });
  });

  describe("detectViewSpike (Bonus Requirement)", () => {
    test("does not flag normal gradual view increases", () => {
      const result = detectViewSpike(5000, 12000, new Date(Date.now() - 3600000));
      expect(result.isSpike).toBe(false);
    });

    test("flags an abnormal single-step jump >= 100,000 views", () => {
      const result = detectViewSpike(1000, 150000);
      expect(result.isSpike).toBe(true);
      expect(result.reason).toContain("Abnormal surge of +");
      expect(result.reason).toContain("views in a single update");
    });

    test("flags sudden rapid velocity spikes within <= 120 seconds", () => {
      // 30,000 view jump in 10 seconds = 3,000 views/sec
      const tenSecondsAgo = new Date(Date.now() - 10000);
      const result = detectViewSpike(5000, 35000, tenSecondsAgo);
      expect(result.isSpike).toBe(true);
      expect(result.reason).toContain("Velocity spike detected");
    });

    test("does not flag when views decrease", () => {
      const result = detectViewSpike(50000, 40000);
      expect(result.isSpike).toBe(false);
    });
  });
});