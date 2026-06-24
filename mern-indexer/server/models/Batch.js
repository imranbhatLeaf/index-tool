import mongoose from "mongoose";

const batchSchema = new mongoose.Schema({
  totalUrls: { type: Number, default: 0 },
}, { timestamps: true });

export default mongoose.model("Batch", batchSchema);
