import { Request, Response } from "express";
import mongoose from "mongoose";
import Campaign from "../models/Campaign";
import { AuthenticatedRequest } from "../middleware/auth";

export async function createCampaign(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const authReq = req as AuthenticatedRequest;
    const { name, platform, totalBudget, milestones } = req.body;

    if (!authReq.user) {
      res.status(401).json({ message: "Authentication required" });
      return;
    }

    if (
      typeof name !== "string" ||
      !name.trim() ||
      !["Instagram", "YouTube"].includes(platform) ||
      typeof totalBudget !== "number" ||
      !Number.isFinite(totalBudget) ||
      totalBudget <= 0 ||
      !Array.isArray(milestones) ||
      milestones.length === 0
    ) {
      res.status(400).json({ message: "Invalid campaign details" });
      return;
    }

    const validMilestones = milestones.every(
      (milestone, index) =>
        milestone &&
        Number.isInteger(milestone.views) &&
        milestone.views > 0 &&
        typeof milestone.payout === "number" &&
        Number.isFinite(milestone.payout) &&
        milestone.payout >= 0 &&
        (index === 0 || milestone.views > milestones[index - 1].views)
    );

    if (!validMilestones) {
      res.status(400).json({
        message: "Milestones must have increasing view thresholds and non-negative payouts",
      });
      return;
    }

    const campaign = await Campaign.create({
      name: name.trim(),
      platform,
      totalBudget,
      milestones,
      brandId: new mongoose.Types.ObjectId(authReq.user.userId),
    });

    res.status(201).json({ campaign });
  } catch (error) {
    console.error("Create campaign error:", error);
    res.status(500).json({ message: "Failed to create campaign" });
  }
}

export async function listCampaigns(
  _req: Request,
  res: Response
): Promise<void> {
  try {
    const campaigns = await Campaign.find()
      .populate("brandId", "name")
      .sort({ createdAt: -1 });

    res.status(200).json({ campaigns });
  } catch (error) {
    console.error("List campaigns error:", error);
    res.status(500).json({ message: "Failed to fetch campaigns" });
  }
}

export async function getBrandCampaigns(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const authReq = req as AuthenticatedRequest;

    if (!authReq.user) {
      res.status(401).json({ message: "Authentication required" });
      return;
    }

    const campaigns = await Campaign.find({
      brandId: authReq.user.userId,
    }).sort({ createdAt: -1 });

    res.status(200).json({ campaigns });
  } catch (error) {
    console.error("Get brand campaigns error:", error);
    res.status(500).json({ message: "Failed to fetch brand campaigns" });
  }
}