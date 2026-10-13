import { calculatePayout, capPayout } from "../src/services/payoutService";

describe("calculatePayout", () => {
  const milestones = [
    { views: 1000, payout: 10 },
    { views: 5000, payout: 50 },
    { views: 10000, payout: 100 },
  ];

  test("returns zero when no milestone is reached", () => {
    expect(calculatePayout(500, milestones)).toBe(0);
  });

  test("returns payout for the highest milestone reached", () => {
    expect(calculatePayout(7000, milestones)).toBe(50);
  });

  test("returns payout at the exact milestone threshold", () => {
    expect(calculatePayout(10000, milestones)).toBe(100);
  });
});

describe("capPayout", () => {
  test("caps payout at the remaining budget", () => {
    expect(capPayout(100, 30)).toBe(30);
  });

  test("allows the full payout when budget is sufficient", () => {
    expect(capPayout(50, 100)).toBe(50);
  });

  test("returns zero when no budget remains", () => {
    expect(capPayout(50, 0)).toBe(0);
  });
});