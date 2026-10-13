import { Router } from "express";
import {
  createSubmission,
  updateViews,
  getMySubmissions,
} from "../controllers/submissionController";
import {
  authenticateToken,
  requireRole,
} from "../middleware/auth";

const router = Router();

// Creators submit posts and view their earnings.
router.post(
  "/",
  authenticateToken,
  requireRole("creator"),
  createSubmission
);

router.get(
  "/my",
  authenticateToken,
  requireRole("creator"),
  getMySubmissions
);

// Intentionally no authentication middleware, as specified by the assignment.
router.patch("/:id/views", updateViews);

export default router;