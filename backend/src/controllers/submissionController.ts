import { Request, Response } from "express";
import mongoose from "mongoose";
import Campaign from "../models/Campaign";
import Submission from "../models/Submission";
import { AuthenticatedRequest } from "../middleware/auth";
import {
  calculatePayout,
  capPayout,
} from "../services/payoutService";

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

export async function updateViews(
  req: Request,
  res: Response
): Promise<void> {
  try {
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

    const desiredPayout = calculatePayout(views, campaign.milestones);
    const payoutDifference = desiredPayout - submission.payout;

    if (payoutDifference > 0) {
      const remainingBudget = Math.max(
        0,
        campaign.totalBudget - campaign.spentBudget
      );

      const additionalPayout = capPayout(
        payoutDifference,
        remainingBudget
      );

      submission.payout += additionalPayout;
      campaign.spentBudget += additionalPayout;
    } else if (payoutDifference < 0) {
      // Do not claw back payouts when simulated views decrease.
      // Keep the previously earned payout.
    }

    submission.views = views;

    await submission.save();
    await campaign.save();

    res.status(200).json({
      submission,
      campaignBudget: {
        total: campaign.totalBudget,
        spent: campaign.spentBudget,
        remaining: Math.max(
          0,
          campaign.totalBudget - campaign.spentBudget
        ),
      },
    });
  } catch (error) {
    console.error("Update views error:", error);
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