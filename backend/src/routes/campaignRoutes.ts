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

// Authenticated users (creators and brands) can browse live campaigns.
router.get("/", authenticateToken, listCampaigns);

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