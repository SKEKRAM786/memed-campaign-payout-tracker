import mongoose, { Document, Schema } from "mongoose";
import "./Campaign";
import "./User";

export interface ISubmission extends Document {
  campaignId: mongoose.Types.ObjectId;
  creatorId: mongoose.Types.ObjectId;
  postUrl: string;
  views: number;
  payout: number;
  isFlagged: boolean;
  flagReason?: string;
  previousViews: number;
  lastViewsUpdatedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const submissionSchema = new Schema<ISubmission>(
  {
    campaignId: {
      type: Schema.Types.ObjectId,
      ref: "Campaign",
      required: true,
    },
    creatorId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    postUrl: {
      type: String,
      required: true,
      trim: true,
    },
    views: {
      type: Number,
      default: 0,
      min: 0,
    },
    payout: {
      type: Number,
      default: 0,
      min: 0,
    },
    isFlagged: {
      type: Boolean,
      default: false,
    },
    flagReason: {
      type: String,
      default: null,
    },
    previousViews: {
      type: Number,
      default: 0,
    },
    lastViewsUpdatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

submissionSchema.index(
  { campaignId: 1, creatorId: 1 },
  { unique: true }
);

export default mongoose.model<ISubmission>(
  "Submission",
  submissionSchema
);