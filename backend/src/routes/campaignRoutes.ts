import { Router } from "express";
import {
  createCampaign,
  listCampaigns,
  getBrandCampaigns,
} from "../controllers/campaignController";
import {
  authenticateToken,
  requireRole,
} from "../middleware/auth";

const router = Router();

// Creators can browse campaigns; login is required.
router.get("/", authenticateToken, requireRole("creator"), listCampaigns);

// Brands can create campaigns.
router.post("/", authenticateToken, requireRole("brand"), createCampaign);

// Brands can view their own campaigns.
router.get(
  "/my",
  authenticateToken,
  requireRole("brand"),
  getBrandCampaigns
);

export default router;