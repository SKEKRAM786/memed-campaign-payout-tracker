import express from "express";
import cors from "cors";
import authRoutes from "./routes/authRoutes";
import campaignRoutes from "./routes/campaignRoutes";
import submissionRoutes from "./routes/submissionRoutes";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "Meme'd Campaign Payout Tracker API is running",
    endpoints: {
      auth: "/api/auth",
      campaigns: "/api/campaigns",
      submissions: "/api/submissions",
      health: "/api/health",
    },
  });
});

app.get("/api/health", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "Meme'd Campaign Payout Tracker API is running",
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/campaigns", campaignRoutes);
app.use("/api/submissions", submissionRoutes);

export default app;