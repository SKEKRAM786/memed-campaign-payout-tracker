import mongoose, { Document, Schema } from "mongoose";

export interface IMilestone {
  views: number;
  payout: number;
}

export interface ICampaign extends Document {
  name: string;
  platform: "Instagram" | "YouTube";
  totalBudget: number;
  spentBudget: number;
  milestones: IMilestone[];
  brandId: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const milestoneSchema = new Schema<IMilestone>(
  {
    views: {
      type: Number,
      required: true,
      min: 1,
    },
    payout: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  { _id: false }
);

const campaignSchema = new Schema<ICampaign>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    platform: {
      type: String,
      enum: ["Instagram", "YouTube"],
      required: true,
    },
    totalBudget: {
      type: Number,
      required: true,
      min: 1,
    },
    spentBudget: {
      type: Number,
      default: 0,
      min: 0,
    },
    milestones: {
      type: [milestoneSchema],
      required: true,
      validate: {
        validator: (milestones: IMilestone[]) =>
          milestones.length > 0 &&
          milestones.every(
            (milestone, index) =>
              index === 0 ||
              milestone.views > milestones[index - 1].views
          ),
        message: "Milestone view thresholds must be strictly increasing",
      },
    },
    brandId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model<ICampaign>("Campaign", campaignSchema);