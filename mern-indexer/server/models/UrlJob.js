import mongoose from "mongoose";

const urlJobSchema = new mongoose.Schema({
  url: { type: String, required: true, index: true },
  status: {
    type: String,
    enum: ["queued", "submitting", "submitted", "failed"],
    default: "queued",
    index: true,
  },
  methodUsed: { type: String, default: null }, // "indexnow" | "sitemap"
  errorMessage: { type: String, default: null },
  attempts: { type: Number, default: 0 },
  batchId: { type: mongoose.Schema.Types.ObjectId, ref: "Batch" },
  submittedAt: { type: Date, default: null },
}, { timestamps: true });

export default mongoose.model("UrlJob", urlJobSchema);
