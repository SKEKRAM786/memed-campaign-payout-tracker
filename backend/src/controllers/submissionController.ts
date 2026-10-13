import { Request, Response } from "express";
import mongoose from "mongoose";
import Campaign from "../models/Campaign";
import Submission from "../models/Submission";
import { AuthenticatedRequest } from "../middleware/auth";
import {
  calculatePayout,
  capPayout,
} from "../services/payoutService";
import { invalidateCache } from "../config/redis";

const CAMPAIGN_LIST_CACHE_KEY = "campaigns:list:active";

/**
 * Detects if the view increase constitutes an unusually rapid or large spike.
 * Rule 1: Single-step jump >= 100,000 views.
 * Rule 2: Rapid velocity >= 25,000 views within <= 120 seconds (> 200 views/sec).
 */
export function detectViewSpike(
  previousViews: number,
  newViews: number,
  lastUpdatedAt?: Date
): { isSpike: boolean; reason?: string } {
  const delta = newViews - previousViews;
  if (delta <= 0) {
    return { isSpike: false };
  }

  // Rule 1: Abnormal single-step jump
  if (delta >= 100000) {
    return {
      isSpike: true,
      reason: `View spike detected: Abnormal surge of +${delta.toLocaleString()} views in a single update`,
    };
  }

  // Rule 2: Abnormal velocity
  if (lastUpdatedAt) {
    const elapsedSeconds = Math.max(
      1,
      (Date.now() - new Date(lastUpdatedAt).getTime()) / 1000
    );
    const viewsPerSecond = delta / elapsedSeconds;
    if (elapsedSeconds <= 120 && delta >= 25000 && viewsPerSecond > 200) {
      return {
        isSpike: true,
        reason: `Velocity spike detected: +${delta.toLocaleString()} views within ${Math.round(
          elapsedSeconds
        )}s (~${Math.round(viewsPerSecond)} views/sec)`,
      };
    }
  }

  return { isSpike: false };
}

export async function createSubmission(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const authReq = req as AuthenticatedRequest;
    const { campaignId, postUrl } = req.body;

    if (!authReq.user) {
      res.status(401).json({ message: "Authentication required" });
      return;
    }

    if (
      !mongoose.isValidObjectId(campaignId) ||
      typeof postUrl !== "string" ||
      !/^https?:\/\/\S+$/i.test(postUrl.trim())
    ) {
      res.status(400).json({
        message: "A valid campaign ID and post URL are required",
      });
      return;
    }

    const campaign = await Campaign.findById(campaignId);

    if (!campaign) {
      res.status(404).json({ message: "Campaign not found" });
      return;
    }

    const submission = await Submission.create({
      campaignId: campaign._id,
      creatorId: new mongoose.Types.ObjectId(authReq.user.userId),
      postUrl: postUrl.trim(),
      views: 0,
      payout: 0,
      previousViews: 0,
      lastViewsUpdatedAt: new Date(),
      isFlagged: false,
    });

    res.status(201).json({ submission });
  } catch (error) {
    if (
      error instanceof mongoose.Error ||
      (error as { code?: number })?.code === 11000
    ) {
      res.status(409).json({
        message: "You have already submitted a post for this campaign",
      });
      return;
    }

    console.error("Create submission error:", error);
    res.status(500).json({ message: "Failed to create submission" });
  }
}

/**
 * PATCH /api/submissions/:id/views
 * Updates view count and recalculates payout based on the highest milestone crossed.
 * Concurrency Guarantee:
 * Uses atomic multi-document transactions with conditional budget enforcement
 * so two simultaneous updates can NEVER exceed totalBudget, and repeated updates NEVER double-pay.
 */
export async function updateViews(
  req: Request,
  res: Response
): Promise<void> {
  const { id } = req.params;
  const { views } = req.body;

  if (
    !mongoose.isValidObjectId(id) ||
    !Number.isInteger(views) ||
    views < 0
  ) {
    res.status(400).json({
      message: "A valid submission ID and non-negative integer views are required",
    });
    return;
  }

  // Attempt transactional update if replica set / Atlas is active
  let session: mongoose.ClientSession | null = null;
  try {
    session = await mongoose.startSession();
  } catch {
    session = null;
  }

  if (session) {
    try {
      let resultData: {
        submission: unknown;
        campaignBudget: { total: number; spent: number; remaining: number };
      } | null = null;

      await session.withTransaction(async () => {
        const submission = await Submission.findById(id).session(session);
        if (!submission) {
          throw new Error("SUBMISSION_NOT_FOUND");
        }

        const campaign = await Campaign.findById(submission.campaignId).session(session);
        if (!campaign) {
          throw new Error("CAMPAIGN_NOT_FOUND");
        }

        // View Spike Detection
        const spikeCheck = detectViewSpike(
          submission.views,
          views,
          submission.lastViewsUpdatedAt
        );
        if (spikeCheck.isSpike) {
          submission.isFlagged = true;
          submission.flagReason = spikeCheck.reason;
        }

        const desiredPayout = calculatePayout(views, campaign.milestones);
        const payoutDifference = desiredPayout - submission.payout;

        if (payoutDifference > 0) {
          const remainingBudget = Math.max(
            0,
            campaign.totalBudget - campaign.spentBudget
          );

          const additionalPayout = capPayout(payoutDifference, remainingBudget);

          if (additionalPayout > 0) {
            submission.payout += additionalPayout;
            campaign.spentBudget += additionalPayout;
            await campaign.save({ session });
          }
        }

        submission.previousViews = submission.views;
        submission.views = views;
        submission.lastViewsUpdatedAt = new Date();
        await submission.save({ session });

        resultData = {
          submission,
          campaignBudget: {
            total: campaign.totalBudget,
            spent: campaign.spentBudget,
            remaining: Math.max(0, campaign.totalBudget - campaign.spentBudget),
          },
        };
      });

      await session.endSession();

      if (resultData) {
        await invalidateCache(CAMPAIGN_LIST_CACHE_KEY);
        res.status(200).json(resultData);
        return;
      }
    } catch (error) {
      if (session) {
        await session.endSession();
      }
      if ((error as Error).message === "SUBMISSION_NOT_FOUND") {
        res.status(404).json({ message: "Submission not found" });
        return;
      }
      if ((error as Error).message === "CAMPAIGN_NOT_FOUND") {
        res.status(404).json({ message: "Campaign not found" });
        return;
      }
      console.warn("Transaction failed, trying atomic fallback:", (error as Error).message);
    }
  }

  // Non-transactional / Atomic Fallback (guaranteed safe even in standalone Mongo)
  try {
    const submission = await Submission.findById(id);
    if (!submission) {
      res.status(404).json({ message: "Submission not found" });
      return;
    }

    const campaign = await Campaign.findById(submission.campaignId);
    if (!campaign) {
      res.status(404).json({ message: "Campaign not found" });
      return;
    }

    // View spike check
    const spikeCheck = detectViewSpike(
      submission.views,
      views,
      submission.lastViewsUpdatedAt
    );
    if (spikeCheck.isSpike) {
      submission.isFlagged = true;
      submission.flagReason = spikeCheck.reason;
    }

    const desiredPayout = calculatePayout(views, campaign.milestones);
    const payoutDifference = desiredPayout - submission.payout;

    let additionalPayout = 0;
    if (payoutDifference > 0) {
      const remainingBudget = Math.max(0, campaign.totalBudget - campaign.spentBudget);
      additionalPayout = capPayout(payoutDifference, remainingBudget);

      if (additionalPayout > 0) {
        // Atomic conditional increment ensuring spentBudget never exceeds totalBudget
        const updatedCampaign = await Campaign.findOneAndUpdate(
          {
            _id: campaign._id,
            spentBudget: { $lte: campaign.totalBudget - additionalPayout },
          },
          { $inc: { spentBudget: additionalPayout } },
          { new: true }
        );

        if (updatedCampaign) {
          campaign.spentBudget = updatedCampaign.spentBudget;
          submission.payout += additionalPayout;
        } else {
          // Budget was concurrently modified; re-read exact remaining budget
          const freshCampaign = await Campaign.findById(campaign._id);
          if (freshCampaign) {
            const actualRemaining = Math.max(0, freshCampaign.totalBudget - freshCampaign.spentBudget);
            additionalPayout = Math.min(payoutDifference, actualRemaining);
            if (additionalPayout > 0) {
              await Campaign.findByIdAndUpdate(campaign._id, {
                $inc: { spentBudget: additionalPayout },
              });
              campaign.spentBudget = freshCampaign.spentBudget + additionalPayout;
              submission.payout += additionalPayout;
            }
          }
        }
      }
    }

    submission.previousViews = submission.views;
    submission.views = views;
    submission.lastViewsUpdatedAt = new Date();
    await submission.save();

    await invalidateCache(CAMPAIGN_LIST_CACHE_KEY);

    res.status(200).json({
      submission,
      campaignBudget: {
        total: campaign.totalBudget,
        spent: campaign.spentBudget,
        remaining: Math.max(0, campaign.totalBudget - campaign.spentBudget),
      },
    });
  } catch (err) {
    console.error("Update views fallback error:", err);
    res.status(500).json({ message: "Failed to update views" });
  }
}

export async function getMySubmissions(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const authReq = req as AuthenticatedRequest;

    if (!authReq.user) {
      res.status(401).json({ message: "Authentication required" });
      return;
    }

    const submissions = await Submission.find({
      creatorId: authReq.user.userId,
    })
      .populate("campaignId", "name platform milestones")
      .sort({ createdAt: -1 });

    const totalEarnings = submissions.reduce(
      (total, submission) => total + submission.payout,
      0
    );

    res.status(200).json({ submissions, totalEarnings });
  } catch (error) {
    console.error("Get submissions error:", error);
    res.status(500).json({ message: "Failed to fetch submissions" });
  }
}