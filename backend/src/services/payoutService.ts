export interface Milestone {
    views: number;
    payout: number;
  }
  
  /**
   * Returns the payout for the highest milestone reached.
   * Returns 0 when no milestone has been reached.
   */
  export function calculatePayout(
    views: number,
    milestones: Milestone[]
  ): number {
    if (!Number.isFinite(views) || views < 0) {
      throw new Error("Views must be a non-negative number");
    }
  
    const sortedMilestones = [...milestones].sort(
      (a, b) => a.views - b.views
    );
  
    let payout = 0;
  
    for (const milestone of sortedMilestones) {
      if (views >= milestone.views) {
        payout = milestone.payout;
      } else {
        break;
      }
    }
  
    return payout;
  }
  
  /**
   * Caps the payout at the campaign's remaining budget.
   */
  export function capPayout(
    calculatedPayout: number,
    remainingBudget: number
  ): number {
    if (
      !Number.isFinite(calculatedPayout) ||
      !Number.isFinite(remainingBudget) ||
      calculatedPayout < 0 ||
      remainingBudget < 0
    ) {
      throw new Error("Payout and remaining budget must be non-negative numbers");
    }
  
    return Math.min(calculatedPayout, remainingBudget);
  }